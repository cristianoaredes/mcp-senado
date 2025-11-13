#!/usr/bin/env node

/**
 * MCP Senado Federal - HTTP Server Entry Point
 *
 * Starts the MCP server with HTTP transport
 */

import { loadConfig } from '../config/config.js';
import { createLogger } from '../infrastructure/logger.js';
import { createHttpClient } from '../infrastructure/http-client.js';
import { createCache } from '../infrastructure/cache.js';
import { createCircuitBreaker } from '../infrastructure/circuit-breaker.js';
import { createToolRegistry } from '../core/tools.js';
import { createHttpAdapter } from '../adapters/http.js';

/**
 * Main function
 */
async function main() {
  try {
    // Load configuration
    const config = loadConfig();

    // Create logger
    const logger = createLogger({
      level: config.logLevel,
      format: config.logFormat,
      maskPII: config.logMaskPII,
    });

    logger.info('Starting MCP Senado Federal HTTP Server', {
      version: config.version,
      nodeEnv: config.nodeEnv,
    });

    // Create circuit breaker
    const circuitBreaker = createCircuitBreaker(
      {
        failureThreshold: config.circuitBreakerFailureThreshold,
        successThreshold: config.circuitBreakerSuccessThreshold,
        timeout: config.circuitBreakerTimeout,
      },
      logger,
      config.circuitBreakerEnabled
    );

    // Create HTTP client
    const httpClient = createHttpClient(
      {
        baseUrl: config.apiBaseUrl,
        timeout: config.apiTimeout,
        maxRetries: config.apiMaxRetries,
        retryDelay: config.apiRetryDelay,
      },
      logger,
      circuitBreaker
    );

    // Create cache
    const cache = createCache(
      {
        ttl: config.cacheTTL,
        maxSize: config.cacheMaxSize,
        cleanupInterval: config.cacheCleanupInterval,
      },
      logger,
      config.cacheEnabled
    );

    // Note: Rate limiter not used in HTTP adapter yet
    // Could be added as Express middleware in the future

    // Create tool registry
    const toolRegistry = createToolRegistry();

    // Register all tools
    const { referenceTools } = await import('../tools/reference-tools.js');
    const { senatorTools } = await import('../tools/senator-tools.js');
    const { proposalTools } = await import('../tools/proposal-tools.js');
    const { votingTools } = await import('../tools/voting-tools.js');
    const { committeeTools } = await import('../tools/committee-tools.js');
    const { partyTools } = await import('../tools/party-tools.js');
    const { sessionTools } = await import('../tools/session-tools.js');

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

    // Create tool context for tool invocations
    const toolContext = {
      httpClient,
      cache,
      config,
      logger,
    };

    // Override tool registry invoke to use context
    const originalInvoke = toolRegistry.invoke.bind(toolRegistry);
    toolRegistry.invoke = async (name: string, args: unknown) => {
      return originalInvoke(name, args, toolContext);
    };

    // Create HTTP adapter
    const httpAdapter = createHttpAdapter(
      toolRegistry,
      logger,
      {
        port: getEnvNumber('HTTP_PORT', 3000),
        host: getEnv('HTTP_HOST') || '0.0.0.0',
        corsOrigin: getEnv('HTTP_CORS_ORIGIN') || '*',
        authEnabled: getEnv('HTTP_AUTH_ENABLED') === 'true',
        authToken: getEnv('HTTP_AUTH_TOKEN'),
        requestTimeout: getEnvNumber('HTTP_REQUEST_TIMEOUT', 30000),
      }
    );

    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', reason as Error, {
        promise: String(promise),
      });
      process.exit(1);
    });

    // Start HTTP server
    await httpAdapter.start();

    logger.info('MCP Senado Federal HTTP Server is running', {
      port: getEnvNumber('HTTP_PORT', 3000),
      url: `http://${getEnv('HTTP_HOST') || '0.0.0.0'}:${getEnvNumber('HTTP_PORT', 3000)}`,
    });
  } catch (error) {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
}

/**
 * Helper to get environment variable
 */
function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Helper to get environment variable as number
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnv(key);
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

// Run main function
main();
