/**
 * HTTP Client for Senado Federal API
 *
 * Handles:
 * - XML to JSON parsing (Senado API returns XML)
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Request/response logging
 */

import { XMLParser } from 'fast-xml-parser';
import type {
  HttpClient,
  HttpClientConfig,
  ApiResponse,
  Logger,
  CircuitBreaker,
} from '../types/index.js';

export class SenadoHttpClient implements HttpClient {
  private readonly config: HttpClientConfig;
  private readonly logger: Logger;
  private readonly circuitBreaker?: CircuitBreaker;
  private readonly xmlParser: XMLParser;

  constructor(
    config: HttpClientConfig,
    logger: Logger,
    circuitBreaker?: CircuitBreaker
  ) {
    this.config = config;
    this.logger = logger;
    this.circuitBreaker = circuitBreaker;

    // Configure XML parser with options for Senado API
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      ignoreDeclaration: true,
      ignorePiTags: true,
    });
  }

  /**
   * Perform GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    const startTime = Date.now();

    this.logger.debug('HTTP GET request', { url, params });

    try {
      const response = await this.executeWithRetry(async () => {
        return await this.performRequest<T>(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });
      });

      const duration = Date.now() - startTime;
      this.logger.debug('HTTP GET response', {
        url,
        statusCode: response.statusCode,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('HTTP GET failed', error as Error, {
        url,
        duration,
      });
      throw error;
    }
  }

  /**
   * Perform POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const startTime = Date.now();

    this.logger.debug('HTTP POST request', { url, data });

    try {
      const response = await this.executeWithRetry(async () => {
        return await this.performRequest<T>(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        });
      });

      const duration = Date.now() - startTime;
      this.logger.debug('HTTP POST response', {
        url,
        statusCode: response.statusCode,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('HTTP POST failed', error as Error, {
        url,
        duration,
      });
      throw error;
    }
  }

  /**
   * Perform actual HTTP request with timeout
   */
  private async performRequest<T>(
    url: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get response text
      const text = await response.text();

      // Parse response based on content type
      let data: T;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // JSON response
        data = JSON.parse(text) as T;
      } else if (
        contentType.includes('application/xml') ||
        contentType.includes('text/xml') ||
        text.trim().startsWith('<?xml')
      ) {
        // XML response - parse to JSON
        const parsed = this.xmlParser.parse(text);
        data = parsed as T;
      } else {
        // Plain text response
        data = { text } as T;
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new SenadoAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url,
          data
        );
      }

      return {
        data,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SenadoAPIError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new SenadoAPIError(
          `Request timeout after ${this.config.timeout}ms`,
          408,
          url
        );
      }

      throw new SenadoAPIError(
        `Request failed: ${(error as Error).message}`,
        500,
        url,
        error
      );
    }
  }

  /**
   * Execute request with retry logic and circuit breaker
   */
  private async executeWithRetry<T>(
    fn: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    const executeRequest = async (): Promise<ApiResponse<T>> => {
      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;

          // Don't retry on client errors (4xx except 429)
          if (
            error instanceof SenadoAPIError &&
            error.statusCode >= 400 &&
            error.statusCode < 500 &&
            error.statusCode !== 429
          ) {
            throw error;
          }

          // Check if we should retry
          if (attempt < this.config.maxRetries) {
            const delay = this.calculateRetryDelay(attempt);
            this.logger.warn(`Request failed, retrying in ${delay}ms`, {
              attempt: attempt + 1,
              maxRetries: this.config.maxRetries,
              error: (error as Error).message,
            });
            await this.sleep(delay);
          }
        }
      }

      throw lastError;
    };

    // Execute with circuit breaker if available
    if (this.circuitBreaker) {
      return await this.circuitBreaker.execute(executeRequest);
    }

    return await executeRequest();
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    return this.config.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;

    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl
      : `${this.config.baseUrl}/`;

    const url = new URL(cleanEndpoint, baseUrl);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Get default headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Accept': 'application/xml, application/json, text/xml, */*',
      'User-Agent': 'MCP-Senado/1.0.0',
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Custom error for Senado API errors
 */
export class SenadoAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SenadoAPIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory function to create HTTP client
 */
export function createHttpClient(
  config: HttpClientConfig,
  logger: Logger,
  circuitBreaker?: CircuitBreaker
): HttpClient {
  return new SenadoHttpClient(config, logger, circuitBreaker);
}
