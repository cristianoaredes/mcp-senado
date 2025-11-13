/**
 * Cloudflare Workers Entry Point
 *
 * Edge deployment for MCP Senado Server
 */

import { createLogger } from '../infrastructure/logger.js';
import { createHttpClient } from '../infrastructure/http-client.js';
import { createCache } from '../infrastructure/cache.js';
import { createCircuitBreaker } from '../infrastructure/circuit-breaker.js';
import { createToolRegistry } from '../core/tools.js';
import { createWorkersAdapter } from '../adapters/workers.js';
import type { ToolContext, LogLevel } from '../types/index.js';

// Import all tools
import { referenceTools } from '../tools/reference-tools.js';
import { senatorTools } from '../tools/senator-tools.js';
import { proposalTools } from '../tools/proposal-tools.js';
import { votingTools } from '../tools/voting-tools.js';
import { committeeTools } from '../tools/committee-tools.js';
import { partyTools } from '../tools/party-tools.js';
import { sessionTools } from '../tools/session-tools.js';

// Environment variables interface for Cloudflare Workers
interface Env {
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
  MCP_RATE_LIMIT_MAX_REQUESTS?: string;
  MCP_RATE_LIMIT_WINDOW_MS?: string;

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
}

/**
 * Get environment variable with default value
 */
function getEnv(env: Env, key: keyof Env, defaultValue: string = ''): string {
  return env[key] || defaultValue;
}

/**
 * Get environment variable as number
 */
function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Get environment variable as boolean
 */
function getEnvBoolean(env: Env, key: keyof Env, defaultValue: boolean): boolean {
  const value = env[key];
  return value ? value === 'true' : defaultValue;
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
 * Initialize MCP Senado for Cloudflare Workers
 */
function initializeMCPSenado(env: Env) {
  // Create logger
  const logger = createLogger({
    level: mapLogLevel(getEnv(env, 'MCP_LOG_LEVEL', 'info')),
    format: 'json',
    maskPII: getEnvBoolean(env, 'MCP_LOG_MASK_PII', false),
  });

  logger.info('Initializing MCP Senado Federal for Cloudflare Workers');

  // Create infrastructure components
  const circuitBreaker = createCircuitBreaker(
    {
      failureThreshold: getEnvNumber(env, 'MCP_CIRCUIT_BREAKER_THRESHOLD', 5),
      successThreshold: 2,
      timeout: getEnvNumber(env, 'MCP_CIRCUIT_BREAKER_TIMEOUT', 60000),
    },
    logger,
    getEnvBoolean(env, 'MCP_CIRCUIT_BREAKER_ENABLED', true)
  );

  const httpClient = createHttpClient(
    {
      baseUrl: getEnv(env, 'SENADO_API_BASE_URL', 'https://legis.senado.leg.br/dadosabertos/'),
      timeout: getEnvNumber(env, 'MCP_HTTP_TIMEOUT', 30000),
      maxRetries: getEnvNumber(env, 'MCP_HTTP_RETRY_ATTEMPTS', 3),
      retryDelay: getEnvNumber(env, 'MCP_HTTP_RETRY_DELAY', 1000),
    },
    logger,
    circuitBreaker
  );

  const cache = createCache(
    {
      ttl: getEnvNumber(env, 'MCP_CACHE_TTL', 300) * 1000,
      maxSize: getEnvNumber(env, 'MCP_CACHE_MAX_SIZE', 1000),
      cleanupInterval: 60000,
    },
    logger,
    getEnvBoolean(env, 'MCP_CACHE_ENABLED', true)
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
  // Note: Using partial config - tools only use specific fields they need
  const toolContext = {
    httpClient,
    cache,
    config: {
      apiBaseUrl: getEnv(env, 'SENADO_API_BASE_URL', 'https://legis.senado.leg.br/dadosabertos/'),
      cacheEnabled: getEnvBoolean(env, 'MCP_CACHE_ENABLED', true),
      cacheTTL: getEnvNumber(env, 'MCP_CACHE_TTL', 300),
      cacheMaxSize: getEnvNumber(env, 'MCP_CACHE_MAX_SIZE', 1000),
      rateLimitEnabled: getEnvBoolean(env, 'MCP_RATE_LIMIT_ENABLED', true),
      rateLimitMaxRequests: getEnvNumber(env, 'MCP_RATE_LIMIT_MAX_REQUESTS', 30),
      rateLimitWindowMs: getEnvNumber(env, 'MCP_RATE_LIMIT_WINDOW_MS', 60000),
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

  // Override tool registry invoke to inject context
  const originalInvoke = toolRegistry.invoke.bind(toolRegistry);
  toolRegistry.invoke = async (name: string, args: unknown) => {
    return originalInvoke(name, args, toolContext);
  };

  // Create Workers adapter
  const workersAdapter = createWorkersAdapter(toolRegistry, logger, {
    corsOrigin: getEnv(env, 'WORKERS_CORS_ORIGIN', '*'),
    authEnabled: getEnvBoolean(env, 'WORKERS_AUTH_ENABLED', false),
    authToken: getEnv(env, 'WORKERS_AUTH_TOKEN'),
  });

  logger.info('Workers adapter initialized');

  return workersAdapter;
}

/**
 * Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize adapter (this could be cached in Workers KV or Durable Objects for performance)
    const adapter = initializeMCPSenado(env);

    // Handle request
    return adapter.fetch(request);
  },
};
