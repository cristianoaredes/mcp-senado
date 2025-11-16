/**
 * Cloudflare Workers Entry Point with Durable Objects
 *
 * Edge deployment for MCP Senado Server with persistent state
 */

import { createLogger } from '../infrastructure/logger.js';
import { createHttpClient } from '../infrastructure/http-client.js';
import { createToolRegistry } from '../core/tools.js';
import { createWorkersAdapter } from '../adapters/workers.js';

const SERVICE_DESCRIPTION = 'Model Context Protocol server for the Brazilian Federal Senate Open Data API.';
const DEFAULT_DOCS_URL = 'https://github.com/cristianoaredes/mcp-senado#readme';
const DEFAULT_REPO_URL = 'https://github.com/cristianoaredes/mcp-senado';
import type {
  ToolContext,
  LogLevel,
  Logger,
  CacheInterface,
  CacheStats,
  CircuitBreaker,
  CircuitBreakerStats,
  CircuitState,
} from '../types/index.js';

// Import all tools
import { referenceTools } from '../tools/reference-tools.js';
import { senatorTools } from '../tools/senator-tools.js';
import { proposalTools } from '../tools/proposal-tools.js';
import { votingTools } from '../tools/voting-tools.js';
import { committeeTools } from '../tools/committee-tools.js';
import { partyTools } from '../tools/party-tools.js';
import { sessionTools } from '../tools/session-tools.js';

// Export Durable Objects so Cloudflare can find them
export { CacheDurableObject } from '../durable-objects/cache-do.js';
export { RateLimiterDurableObject } from '../durable-objects/rate-limiter-do.js';
export { CircuitBreakerDurableObject } from '../durable-objects/circuit-breaker-do.js';
export { MetricsDurableObject } from '../durable-objects/metrics-do.js';

// Environment variables interface for Cloudflare Workers
interface Env {
  // Durable Object Bindings
  CACHE: DurableObjectNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  CIRCUIT_BREAKER: DurableObjectNamespace;
  METRICS: DurableObjectNamespace;

  // Workers KV Namespace (for static/long-lived cache data)
  STATIC_CACHE_KV: KVNamespace;

  // Analytics Engine Dataset (for detailed metrics tracking)
  ANALYTICS: AnalyticsEngineDataset;

  // API Configuration
  SENADO_API_BASE_URL?: string;

  // Workers Configuration
  WORKERS_CORS_ORIGIN?: string;
  WORKERS_AUTH_ENABLED?: string;
  WORKERS_AUTH_TOKEN?: string;

  // Cache Configuration
  MCP_CACHE_ENABLED?: string;
  MCP_CACHE_TTL?: string;
  MCP_CACHE_MAX_SIZE?: string;

  // Rate Limiting
  MCP_RATE_LIMIT_ENABLED?: string;
  MCP_RATE_LIMIT_MAX_TOKENS?: string;
  MCP_RATE_LIMIT_REFILL_RATE?: string;

  // Circuit Breaker
  MCP_CIRCUIT_BREAKER_ENABLED?: string;
  MCP_CIRCUIT_BREAKER_THRESHOLD?: string;
  MCP_CIRCUIT_BREAKER_TIMEOUT?: string;

  // HTTP Client
  MCP_HTTP_TIMEOUT?: string;
  MCP_HTTP_RETRY_ATTEMPTS?: string;
  MCP_HTTP_RETRY_DELAY?: string;

  // Logging
  MCP_LOG_LEVEL?: string;
  MCP_LOG_MASK_PII?: string;

  // Metadata
  MCP_SERVER_NAME?: string;
  MCP_SERVER_VERSION?: string;
  MCP_DOCUMENTATION_URL?: string;
  MCP_REPOSITORY_URL?: string;
  ENVIRONMENT?: string;
}

/**
 * Get environment variable with default value
 */
function getEnv(env: Env, key: keyof Env, defaultValue: string = ''): string {
  const value = env[key];
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * Get environment variable as number
 */
function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  return typeof value === 'string' ? parseInt(value, 10) : defaultValue;
}

/**
 * Get environment variable as boolean
 */
function getEnvBoolean(env: Env, key: keyof Env, defaultValue: boolean): boolean {
  const value = env[key];
  return typeof value === 'string' ? value === 'true' : defaultValue;
}

/**
 * Map log level string to LogLevel enum
 */
function mapLogLevel(level: string): LogLevel {
  const levelMap: Record<string, LogLevel> = {
    'DEBUG': 'DEBUG' as LogLevel,
    'INFO': 'INFO' as LogLevel,
    'WARN': 'WARN' as LogLevel,
    'ERROR': 'ERROR' as LogLevel,
    'debug': 'DEBUG' as LogLevel,
    'info': 'INFO' as LogLevel,
    'warn': 'WARN' as LogLevel,
    'error': 'ERROR' as LogLevel,
  };
  return levelMap[level] || ('INFO' as LogLevel);
}

/**
 * Hybrid Cache Adapter
 *
 * Uses Workers KV for static/long-lived data (reference data)
 * and Durable Objects for dynamic/short-lived data
 */
class HybridCacheAdapter implements CacheInterface {
  private stub: DurableObjectStub;
  private kv: KVNamespace | null;
  private logger: Logger;
  private enabled: boolean;
  private staticPrefixes = ['ref:', 'legislaturas:', 'ufs:', 'tipos:', 'partidos:'];

  constructor(
    stub: DurableObjectStub,
    kv: KVNamespace | null,
    logger: Logger,
    enabled: boolean = true
  ) {
    this.stub = stub;
    this.kv = kv;
    this.logger = logger;
    this.enabled = enabled;
  }

  /**
   * Check if key is for static/reference data
   */
  private isStaticKey(key: string): boolean {
    return this.staticPrefixes.some((prefix) => key.startsWith(prefix));
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Try KV first for static data
      if (this.isStaticKey(key) && this.kv) {
        const kvValue = await this.kv.get(key, { type: 'json' });
        if (kvValue) {
          this.logger.debug('Cache hit (KV)', { key });
          return kvValue as T;
        }
      }

      // Fall back to Durable Object cache
      const url = new URL('http://do/get');
      url.searchParams.set('key', key);
      const response = await this.stub.fetch(url.toString());
      const data = await response.json() as { found: boolean; value?: T };

      if (data.found && data.value !== undefined) {
        this.logger.debug('Cache hit (DO)', { key });
        return data.value;
      }

      this.logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      this.logger.error('Cache get error', error as Error, { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Use KV for static data with long TTL (24 hours default)
      if (this.isStaticKey(key) && this.kv) {
        const expirationTtl = ttl ? Math.floor(ttl / 1000) : 86400; // 24h in seconds
        await this.kv.put(key, JSON.stringify(value), {
          expirationTtl,
        });
        this.logger.debug('Cache set (KV)', { key, ttl: expirationTtl });
        return;
      }

      // Use DO for dynamic data
      await this.stub.fetch('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, ttl }),
      });
      this.logger.debug('Cache set (DO)', { key, ttl });
    } catch (error) {
      this.logger.error('Cache set error', error as Error, { key });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Delete from both KV and DO
      if (this.isStaticKey(key) && this.kv) {
        await this.kv.delete(key);
        this.logger.debug('Cache delete (KV)', { key });
      }

      const url = new URL('http://do/delete');
      url.searchParams.set('key', key);
      await this.stub.fetch(url.toString(), { method: 'DELETE' });
      this.logger.debug('Cache delete (DO)', { key });
    } catch (error) {
      this.logger.error('Cache delete error', error as Error, { key });
    }
  }

  async clear(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Note: KV doesn't have a clear all operation, only DO
      await this.stub.fetch('http://do/clear', { method: 'POST' });
      this.logger.info('Cache cleared (DO only - KV requires manual cleanup)');
    } catch (error) {
      this.logger.error('Cache clear error', error as Error);
    }
  }

  generateKey(prefix: string, params: Record<string, unknown>): string {
    // Sort params by key for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${prefix}:${sortedParams}`;
  }

  getStats(): CacheStats {
    // Stats are async in DO, return placeholder
    // Could be enhanced to cache stats locally or fetch async
    return {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
    };
  }
}

/**
 * Durable Object Circuit Breaker Adapter
 *
 * Wraps Durable Object HTTP calls to implement CircuitBreaker interface
 */
class DurableObjectCircuitBreakerAdapter implements CircuitBreaker {
  private stub: DurableObjectStub;
  private logger: Logger;
  private enabled: boolean;
  private config: {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
  };
  private circuitKey: string;

  constructor(
    stub: DurableObjectStub,
    logger: Logger,
    config: { failureThreshold: number; successThreshold: number; timeout: number },
    enabled: boolean = true
  ) {
    this.stub = stub;
    this.logger = logger;
    this.config = config;
    this.enabled = enabled;
    this.circuitKey = 'senado-api';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return await fn();
    }

    // Check if circuit allows request
    try {
      const checkResponse = await this.stub.fetch('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: this.circuitKey,
          failureThreshold: this.config.failureThreshold,
          successThreshold: this.config.successThreshold,
          timeout: this.config.timeout,
        }),
      });

      const checkData = await checkResponse.json() as {
        allowed: boolean;
        state: CircuitState;
      };

      if (!checkData.allowed) {
        this.logger.warn('Circuit breaker OPEN (DO)', { state: checkData.state });
        throw new Error('Circuit breaker is OPEN');
      }

      // Execute function
      try {
        const result = await fn();

        // Record success
        await this.stub.fetch('http://do/recordSuccess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: this.circuitKey }),
        });

        return result;
      } catch (error) {
        // Record failure
        await this.stub.fetch('http://do/recordFailure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: this.circuitKey }),
        });

        throw error;
      }
    } catch (error) {
      this.logger.error('Circuit breaker error (DO)', error as Error);
      // Fallback to executing function on DO errors
      return await fn();
    }
  }

  getState(): CircuitState {
    // State is async in DO, return default
    // Could be enhanced to cache state locally
    return 'CLOSED' as CircuitState;
  }

  getStats(): CircuitBreakerStats {
    // Stats are async in DO, return placeholder
    return {
      state: 'CLOSED' as CircuitState,
      failures: 0,
      successes: 0,
    };
  }
}

/**
 * Initialize MCP Senado for Cloudflare Workers with Durable Objects
 */
function initializeMCPSenado(env: Env) {
  // Create logger
  const logger = createLogger({
    level: mapLogLevel(getEnv(env, 'MCP_LOG_LEVEL', 'info')),
    format: 'json',
    maskPII: getEnvBoolean(env, 'MCP_LOG_MASK_PII', false),
  });

  logger.info('Initializing MCP Senado Federal for Cloudflare Workers with Durable Objects');

  // Get Durable Object stubs (using unique IDs for global singleton pattern)
  const cacheId = env.CACHE.idFromName('global-cache');
  const cacheStub = env.CACHE.get(cacheId);

  const circuitBreakerId = env.CIRCUIT_BREAKER.idFromName('global-circuit-breaker');
  const circuitBreakerStub = env.CIRCUIT_BREAKER.get(circuitBreakerId);

  const metricsId = env.METRICS.idFromName('global-metrics');
  const metricsStub = env.METRICS.get(metricsId);

  // Create infrastructure components using Hybrid Cache (KV + Durable Objects)
  const cache = new HybridCacheAdapter(
    cacheStub,
    env.STATIC_CACHE_KV || null,
    logger,
    getEnvBoolean(env, 'MCP_CACHE_ENABLED', true)
  );

  const circuitBreaker = new DurableObjectCircuitBreakerAdapter(
    circuitBreakerStub,
    logger,
    {
      failureThreshold: getEnvNumber(env, 'MCP_CIRCUIT_BREAKER_THRESHOLD', 5),
      successThreshold: 2,
      timeout: getEnvNumber(env, 'MCP_CIRCUIT_BREAKER_TIMEOUT', 60000),
    },
    getEnvBoolean(env, 'MCP_CIRCUIT_BREAKER_ENABLED', true)
  );

  const httpClient = createHttpClient(
    {
      baseUrl: getEnv(env, 'SENADO_API_BASE_URL', 'https://legis.senado.leg.br/dadosabertos'),
      timeout: getEnvNumber(env, 'MCP_HTTP_TIMEOUT', 30000),
      maxRetries: getEnvNumber(env, 'MCP_HTTP_RETRY_ATTEMPTS', 3),
      retryDelay: getEnvNumber(env, 'MCP_HTTP_RETRY_DELAY', 1000),
    },
    logger,
    circuitBreaker
  );

  // Create tool registry
  const toolRegistry = createToolRegistry();

  // Register all tools
  toolRegistry.registerMany(referenceTools);
  toolRegistry.registerMany(senatorTools);
  toolRegistry.registerMany(proposalTools);
  toolRegistry.registerMany(votingTools);
  toolRegistry.registerMany(committeeTools);
  toolRegistry.registerMany(partyTools);
  toolRegistry.registerMany(sessionTools);

  logger.info('Tool registry initialized', {
    toolCount: toolRegistry.count(),
    categories: toolRegistry.getCategories(),
  });

  // Create tool context
  const toolContext = {
    httpClient,
    cache,
    config: {
      apiBaseUrl: getEnv(env, 'SENADO_API_BASE_URL', 'https://legis.senado.leg.br/dadosabertos'),
      cacheEnabled: getEnvBoolean(env, 'MCP_CACHE_ENABLED', true),
      cacheTTL: getEnvNumber(env, 'MCP_CACHE_TTL', 300),
      cacheMaxSize: getEnvNumber(env, 'MCP_CACHE_MAX_SIZE', 1000),
      rateLimitEnabled: getEnvBoolean(env, 'MCP_RATE_LIMIT_ENABLED', true),
      rateLimitMaxRequests: getEnvNumber(env, 'MCP_RATE_LIMIT_MAX_TOKENS', 30),
      rateLimitWindowMs: 60000, // Not used with DO token bucket
      circuitBreakerEnabled: getEnvBoolean(env, 'MCP_CIRCUIT_BREAKER_ENABLED', true),
      circuitBreakerThreshold: getEnvNumber(env, 'MCP_CIRCUIT_BREAKER_THRESHOLD', 5),
      circuitBreakerTimeout: getEnvNumber(env, 'MCP_CIRCUIT_BREAKER_TIMEOUT', 60000),
      httpTimeout: getEnvNumber(env, 'MCP_HTTP_TIMEOUT', 30000),
      httpRetryAttempts: getEnvNumber(env, 'MCP_HTTP_RETRY_ATTEMPTS', 3),
      httpRetryDelay: getEnvNumber(env, 'MCP_HTTP_RETRY_DELAY', 1000),
      logLevel: getEnv(env, 'MCP_LOG_LEVEL', 'info'),
    },
    logger,
  } as unknown as ToolContext;

  // Override tool registry invoke to inject context and track metrics
  const originalInvoke = toolRegistry.invoke.bind(toolRegistry);
  toolRegistry.invoke = async (name: string, args: unknown) => {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await originalInvoke(name, args, toolContext);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Record metrics to Durable Object (fire and forget)
      const tool = toolRegistry.get(name);
      if (tool) {
        metricsStub.fetch('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: name,
            category: tool.category,
            success,
            duration,
          }),
        }).catch((error) => {
          logger.warn('Failed to record metrics to DO', { error });
        });

        // Record to Analytics Engine for detailed tracking
        if (env.ANALYTICS) {
          try {
            env.ANALYTICS.writeDataPoint({
              blobs: [name, tool.category, success ? 'success' : 'error'],
              doubles: [duration],
              indexes: [success ? '1' : '0'],
            });
          } catch (error) {
            logger.warn('Failed to record to Analytics Engine', { error });
          }
        }
      }
    }
  };

  // Create Workers adapter
  const workersAdapter = createWorkersAdapter(toolRegistry, logger, {
    corsOrigin: getEnv(env, 'WORKERS_CORS_ORIGIN', '*'),
    authEnabled: getEnvBoolean(env, 'WORKERS_AUTH_ENABLED', false),
    authToken: getEnv(env, 'WORKERS_AUTH_TOKEN'),
    serviceInfo: {
      name: getEnv(env, 'MCP_SERVER_NAME', 'mcp-senado'),
      description: SERVICE_DESCRIPTION,
      version: getEnv(env, 'MCP_SERVER_VERSION', '1.0.0'),
      environment: getEnv(env, 'ENVIRONMENT', 'production'),
      documentationUrl: getEnv(env, 'MCP_DOCUMENTATION_URL', DEFAULT_DOCS_URL),
      repositoryUrl: getEnv(env, 'MCP_REPOSITORY_URL', DEFAULT_REPO_URL),
    },
  });

  logger.info('Workers adapter initialized with Durable Objects');

  return workersAdapter;
}

/**
 * Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize adapter
    // Note: In production, this initialization happens on each request
    // but Durable Objects maintain persistent state across requests
    const adapter = initializeMCPSenado(env);

    // Handle request
    return adapter.fetch(request);
  },
};
