#!/usr/bin/env node

/**
 * MCP Senado Federal - CLI Entry Point
 *
 * Initializes and runs the MCP server with stdio transport
 */

import { loadConfig } from '../config/config.js';
import { createLogger } from '../infrastructure/logger.js';
import { createHttpClient } from '../infrastructure/http-client.js';
import { createCache } from '../infrastructure/cache.js';
import { createCircuitBreaker } from '../infrastructure/circuit-breaker.js';
import { createRateLimiter } from '../infrastructure/rate-limiter.js';
import { createToolRegistry } from '../core/tools.js';
import { createMCPServer } from '../core/mcp-server.js';

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

    logger.info('Starting MCP Senado Federal Server', {
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

    // Create rate limiter
    const rateLimiter = createRateLimiter(
      {
        tokens: config.rateLimitTokens,
        interval: config.rateLimitInterval,
        refillRate: config.rateLimitRefillRate,
      },
      logger,
      config.rateLimitEnabled
    );

    // Create tool registry
    const toolRegistry = createToolRegistry();

    // Register all tools
    const { referenceTools } = await import('../tools/reference-tools.js');
    const { senatorTools } = await import('../tools/senator-tools.js');
    const { proposalTools } = await import('../tools/proposal-tools.js');
    const { votingTools } = await import('../tools/voting-tools.js');
    const { committeeTools } = await import('../tools/committee-tools.js');
    const { partyTools } = await import('../tools/party-tools.js');

    toolRegistry.registerMany(referenceTools);
    toolRegistry.registerMany(senatorTools);
    toolRegistry.registerMany(proposalTools);
    toolRegistry.registerMany(votingTools);
    toolRegistry.registerMany(committeeTools);
    toolRegistry.registerMany(partyTools);

    logger.info('Tool registry initialized', {
      toolCount: toolRegistry.count(),
      categories: toolRegistry.getCategories(),
    });

    // Create MCP server
    const mcpServer = createMCPServer(
      config,
      logger,
      toolRegistry,
      httpClient,
      cache,
      rateLimiter
    );

    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await mcpServer.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await mcpServer.close();
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

    // Run server
    await mcpServer.runStdio();

    logger.info('MCP Senado Federal Server is running');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run main function
main();
