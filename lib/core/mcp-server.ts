/**
 * MCP Server Core
 *
 * Main server class that:
 * - Extends MCP SDK Server
 * - Manages tool registry
 * - Handles tool invocation with caching
 * - Provides MCP protocol handlers
 * - Coordinates infrastructure components
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import type {
  MCPServerConfig,
  Logger,
  HttpClient,
  CacheInterface,
  RateLimiter,
  ToolContext,
  ToolResult,
} from '../types/index.js';

import { ToolRegistry } from './tools.js';
import { errorToToolResult } from './errors.js';

/**
 * Senado MCP Server
 */
export class SenadoMCPServer {
  private readonly server: Server;
  private readonly config: MCPServerConfig;
  private readonly logger: Logger;
  private readonly toolRegistry: ToolRegistry;
  private readonly httpClient: HttpClient;
  private readonly cache: CacheInterface;
  private readonly rateLimiter: RateLimiter;
  private readonly toolContext: ToolContext;
  private readonly stats: ServerStats;

  constructor(
    config: MCPServerConfig,
    logger: Logger,
    toolRegistry: ToolRegistry,
    httpClient: HttpClient,
    cache: CacheInterface,
    rateLimiter: RateLimiter
  ) {
    this.config = config;
    this.logger = logger;
    this.toolRegistry = toolRegistry;
    this.httpClient = httpClient;
    this.cache = cache;
    this.rateLimiter = rateLimiter;

    // Create tool context
    this.toolContext = {
      httpClient,
      cache,
      config,
      logger,
    };

    // Initialize stats
    this.stats = {
      toolInvocations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // Create MCP server
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Setup handlers
    this.setupHandlers();

    this.logger.info('MCP Server initialized', {
      name: config.name,
      version: config.version,
      toolCount: toolRegistry.count(),
    });
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => {
        const tools = this.toolRegistry.getAll();

        this.logger.debug('List tools request', {
          count: tools.length,
        });

        return {
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        };
      }
    );

    // Call tool handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;
        const startTime = Date.now();

        this.stats.toolInvocations++;

        this.logger.info('Tool invocation started', {
          tool: name,
          args,
        });

        try {
          // Check rate limit
          if (this.config.rateLimitEnabled) {
            const allowed = await this.rateLimiter.checkLimit();
            if (!allowed) {
              const error = new Error('Rate limit exceeded');
              error.name = 'RateLimitError';
              throw error;
            }
          }

          // Try to get from cache
          const cacheKey = this.cache.generateKey(name, args as Record<string, unknown>);

          if (this.config.cacheEnabled) {
            const cached = await this.cache.get<ToolResult>(cacheKey);
            if (cached) {
              this.stats.cacheHits++;
              this.logger.logCacheHit(cacheKey);

              const duration = Date.now() - startTime;
              this.logger.logToolInvocation(name, args, duration);

              return cached;
            }

            this.stats.cacheMisses++;
            this.logger.logCacheMiss(cacheKey);
          }

          // Invoke tool
          const result = await this.toolRegistry.invoke(
            name,
            args,
            this.toolContext
          );

          // Cache result if enabled
          if (this.config.cacheEnabled && !result.isError) {
            await this.cache.set(cacheKey, result);
          }

          const duration = Date.now() - startTime;
          this.logger.logToolInvocation(name, args, duration);

          return result;
        } catch (error) {
          this.stats.errors++;

          const duration = Date.now() - startTime;
          this.logger.error(
            'Tool invocation failed',
            error as Error,
            {
              tool: name,
              args,
              duration,
            }
          );

          // Transform error to tool result
          return errorToToolResult(error);
        }
      }
    );
  }

  /**
   * Get underlying MCP server
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Get tool registry
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Get server statistics
   */
  getStats(): ServerStats {
    const cacheStats = this.cache.getStats();
    const rateLimiterStats = this.rateLimiter.getStats();
    const uptime = Date.now() - this.stats.startTime;

    return {
      ...this.stats,
      uptime,
      cache: cacheStats,
      rateLimiter: rateLimiterStats,
    };
  }

  /**
   * Get health status
   */
  getHealth(): HealthStatus {
    const stats = this.getStats();

    return {
      status: 'healthy',
      uptime: stats.uptime,
      toolCount: this.toolRegistry.count(),
      stats: {
        toolInvocations: stats.toolInvocations,
        cacheHitRate: stats.cache?.hitRate || 0,
        errors: stats.errors,
      },
    };
  }

  /**
   * Run server with stdio transport
   */
  async runStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('MCP Server running with stdio transport');

    // Log tool registry summary
    this.logger.debug(this.toolRegistry.getSummary());
  }

  /**
   * Close server
   */
  async close(): Promise<void> {
    await this.server.close();
    this.logger.info('MCP Server closed');
  }
}

/**
 * Server statistics
 */
export interface ServerStats {
  toolInvocations: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  startTime: number;
  uptime?: number;
  cache?: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  rateLimiter?: {
    tokens: number;
    maxTokens: number;
    refillRate: number;
    lastRefillTime: number;
  };
}

/**
 * Health status
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  toolCount: number;
  stats: {
    toolInvocations: number;
    cacheHitRate: number;
    errors: number;
  };
}

/**
 * Factory function to create MCP server
 */
export function createMCPServer(
  config: MCPServerConfig,
  logger: Logger,
  toolRegistry: ToolRegistry,
  httpClient: HttpClient,
  cache: CacheInterface,
  rateLimiter: RateLimiter
): SenadoMCPServer {
  return new SenadoMCPServer(
    config,
    logger,
    toolRegistry,
    httpClient,
    cache,
    rateLimiter
  );
}
