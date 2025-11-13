/**
 * Error Handling
 *
 * Centralized error classes and utilities for:
 * - API errors
 * - Validation errors
 * - Rate limit errors
 * - Circuit breaker errors
 * - Error-to-ToolResult transformation
 */

import type { ToolResult } from '../types/index.js';

/**
 * Base error class for MCP Senado
 */
export class MCPSenadoError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'MCPSenadoError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * API error (already defined in http-client, re-export here)
 */
export class SenadoAPIError extends MCPSenadoError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly details?: unknown
  ) {
    super(message, 'SENADO_API_ERROR');
    this.name = 'SenadoAPIError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends MCPSenadoError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error (already defined in rate-limiter, re-export here)
 */
export class RateLimitError extends MCPSenadoError {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * Circuit breaker error (already defined in circuit-breaker, re-export here)
 */
export class CircuitBreakerError extends MCPSenadoError {
  constructor(
    message: string,
    public readonly lastFailureTime?: number
  ) {
    super(message, 'CIRCUIT_BREAKER_ERROR');
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Tool not found error
 */
export class ToolNotFoundError extends MCPSenadoError {
  constructor(public readonly toolName: string) {
    super(`Tool not found: ${toolName}`, 'TOOL_NOT_FOUND');
    this.name = 'ToolNotFoundError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends MCPSenadoError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Transform error to MCP ToolResult
 */
export function errorToToolResult(error: unknown): ToolResult {
  // Handle known error types
  if (error instanceof SenadoAPIError) {
    return {
      content: [
        {
          type: 'text',
          text: formatSenadoAPIError(error),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof ValidationError) {
    return {
      content: [
        {
          type: 'text',
          text: formatValidationError(error),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof RateLimitError) {
    return {
      content: [
        {
          type: 'text',
          text: formatRateLimitError(error),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof CircuitBreakerError) {
    return {
      content: [
        {
          type: 'text',
          text: formatCircuitBreakerError(error),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof ToolNotFoundError) {
    return {
      content: [
        {
          type: 'text',
          text: formatToolNotFoundError(error),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      content: [
        {
          type: 'text',
          text: formatConfigurationError(error),
        },
      ],
      isError: true,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      content: [
        {
          type: 'text',
          text: formatGenericError(error),
        },
      ],
      isError: true,
    };
  }

  // Handle unknown errors
  return {
    content: [
      {
        type: 'text',
        text: `Unknown error: ${String(error)}`,
      },
    ],
    isError: true,
  };
}

/**
 * Format Senado API error
 */
function formatSenadoAPIError(error: SenadoAPIError): string {
  let message = `API Error (${error.statusCode}): ${error.message}\n`;
  message += `Endpoint: ${error.endpoint}\n`;

  if (error.details) {
    message += `\nDetails:\n${JSON.stringify(error.details, null, 2)}`;
  }

  // Add helpful suggestions based on status code
  if (error.statusCode === 404) {
    message += '\n\nSuggestion: Verifique se o código/ID fornecido está correto.';
  } else if (error.statusCode === 429) {
    message += '\n\nSuggestion: Aguarde alguns segundos antes de tentar novamente.';
  } else if (error.statusCode >= 500) {
    message += '\n\nSuggestion: O servidor do Senado pode estar temporariamente indisponível. Tente novamente em alguns minutos.';
  }

  return message;
}

/**
 * Format validation error
 */
function formatValidationError(error: ValidationError): string {
  let message = `Validation Error: ${error.message}\n`;
  message += `Field: ${error.field}\n`;
  message += `Value: ${JSON.stringify(error.value)}\n`;
  message += '\nSuggestion: Verifique se os parâmetros fornecidos estão no formato correto.';

  return message;
}

/**
 * Format rate limit error
 */
function formatRateLimitError(error: RateLimitError): string {
  const retryAfterSeconds = Math.ceil(error.retryAfter / 1000);

  let message = `Rate Limit Error: ${error.message}\n`;
  message += `Retry after: ${retryAfterSeconds} seconds\n`;
  message += '\nSuggestion: Aguarde alguns segundos antes de fazer novas requisições.';

  return message;
}

/**
 * Format circuit breaker error
 */
function formatCircuitBreakerError(error: CircuitBreakerError): string {
  let message = `Circuit Breaker Error: ${error.message}\n`;

  if (error.lastFailureTime) {
    const secondsSinceFailure = Math.floor(
      (Date.now() - error.lastFailureTime) / 1000
    );
    message += `Last failure: ${secondsSinceFailure} seconds ago\n`;
  }

  message += '\nSuggestion: O sistema está temporariamente indisponível devido a múltiplas falhas. Aguarde alguns segundos.';

  return message;
}

/**
 * Format tool not found error
 */
function formatToolNotFoundError(error: ToolNotFoundError): string {
  let message = `Tool Not Found: ${error.toolName}\n`;
  message += '\nSuggestion: Verifique se o nome da ferramenta está correto. Use a ferramenta "tools/list" para ver todas as ferramentas disponíveis.';

  return message;
}

/**
 * Format configuration error
 */
function formatConfigurationError(error: ConfigurationError): string {
  let message = `Configuration Error: ${error.message}\n`;
  message += '\nSuggestion: Verifique as variáveis de ambiente e o arquivo .mcprc.json.';

  return message;
}

/**
 * Format generic error
 */
function formatGenericError(error: Error): string {
  let message = `Error: ${error.message}\n`;

  if (error.stack) {
    message += `\nStack trace:\n${error.stack}`;
  }

  return message;
}

/**
 * Check if error is retriable
 */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof SenadoAPIError) {
    // Retry on 5xx errors and 429 (rate limit)
    return (
      error.statusCode >= 500 ||
      error.statusCode === 429 ||
      error.statusCode === 408 // Timeout
    );
  }

  if (error instanceof CircuitBreakerError) {
    // Don't retry circuit breaker errors
    return false;
  }

  if (error instanceof ValidationError) {
    // Don't retry validation errors
    return false;
  }

  // Retry network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    );
  }

  return false;
}
