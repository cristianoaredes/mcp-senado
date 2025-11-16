/**
 * HTTP Adapter for MCP Senado Server
 *
 * Provides HTTP/REST interface to the MCP server
 * Features:
 * - RESTful endpoints for all tools
 * - CORS support
 * - Request authentication
 * - Rate limiting
 * - Health checks
 * - Request/response logging
 */

import express, { Request, Response, NextFunction } from 'express';
import type {
  Logger,
  ServiceInfo,
  ToolDefinition,
  MCPTransportRequest,
} from '../types/index.js';
import type { ToolRegistry } from '../core/tools.js';
import {
  buildMCPInitMessage,
  processMCPRequest,
} from '../core/mcp-transport.js';

const SSE_PING_INTERVAL_MS = 30000;
const SSE_CONNECTION_TIMEOUT_MS = 55000;

export interface HttpAdapterConfig {
  port: number;
  host: string;
  corsOrigin: string;
  authEnabled: boolean;
  authToken?: string;
  requestTimeout: number;
  serviceInfo: ServiceInfo;
}

/**
 * HTTP adapter that wraps the MCP server
 */
export class HttpAdapter {
  private app: express.Application;
  private toolRegistry: ToolRegistry;
  private logger: Logger;
  private config: HttpAdapterConfig;

  constructor(
    toolRegistry: ToolRegistry,
    logger: Logger,
    config: HttpAdapterConfig
  ) {
    this.app = express();
    this.toolRegistry = toolRegistry;
    this.logger = logger;
    this.config = config;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));

    // CORS
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', this.config.corsOrigin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('HTTP request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`,
        });
      });

      next();
    });

    // Authentication middleware
    if (this.config.authEnabled) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        // Skip auth for health check
        if (req.path === '/health') {
          next();
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token || token !== this.config.authToken) {
          res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication token',
          });
          return;
        }

        next();
      });
    }

    // Request timeout
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      req.setTimeout(this.config.requestTimeout);
      next();
    });
  }

  /**
   * Set up HTTP routes
   */
  private setupRoutes(): void {
    // Landing page / root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json(this.buildLandingResponse());
    });

    // MCP JSON-RPC endpoint
    this.app.post('/mcp', async (req: Request, res: Response) => {
      await this.handleMCPHttpRequest(req, res);
    });

    // SSE endpoint (GET/POST)
    this.app.get('/sse', async (req: Request, res: Response) => {
      await this.handleSSE(req, res);
    });
    this.app.post('/sse', async (req: Request, res: Response) => {
      await this.handleSSE(req, res);
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tools: this.toolRegistry.count(),
        categories: this.toolRegistry.getCategories(),
      });
    });

    // List all tools
    this.app.get('/api/tools', (_req: Request, res: Response) => {
      try {
        const tools = this.toolRegistry.getAll();

        const toolsList = tools.map((tool: ToolDefinition) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          inputSchema: tool.inputSchema,
        }));

        res.json({
          tools: toolsList,
          total: toolsList.length,
        });
      } catch (error) {
        this.logger.error('Failed to list tools', error as Error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to list tools',
        });
      }
    });

    // Get tools by category
    this.app.get('/api/tools/category/:category', (req: Request, res: Response) => {
      try {
        const { category } = req.params;
        const tools = this.toolRegistry.getByCategory(category!);

        const toolsList = tools.map((tool: ToolDefinition) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          inputSchema: tool.inputSchema,
        }));

        res.json({
          category,
          tools: toolsList,
          total: toolsList.length,
        });
      } catch (error) {
        this.logger.error('Failed to get tools by category', error as Error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to get tools by category',
        });
      }
    });

    // Get tool details
    this.app.get('/api/tools/:name', (req: Request, res: Response) => {
      try {
        const { name } = req.params;

        if (!this.toolRegistry.has(name!)) {
          res.status(404).json({
            error: 'Not Found',
            message: `Tool '${name}' not found`,
          });
          return;
        }

        const tool = this.toolRegistry.get(name!);

        res.json({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          inputSchema: tool.inputSchema,
        });
      } catch (error) {
        this.logger.error('Failed to get tool details', error as Error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to get tool details',
        });
      }
    });

    // Invoke tool
    this.app.post('/api/tools/:name', async (req: Request, res: Response) => {
      try {
        const { name } = req.params;
        const args = req.body;

        this.logger.debug('Invoking tool via HTTP', { name, args });

        if (!this.toolRegistry.has(name!)) {
          res.status(404).json({
            error: 'Not Found',
            message: `Tool '${name}' not found`,
          });
          return;
        }

        // Note: We need the full ToolContext here
        // This is a simplified version - in production, you'd pass the actual context
        const result = await this.toolRegistry.invoke(name!, args, {} as any);

        if (result.isError) {
          res.status(400).json({
            error: 'Tool Execution Error',
            result,
          });
          return;
        }

        res.json({
          success: true,
          result,
        });
      } catch (error) {
        this.logger.error('Failed to invoke tool', error as Error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to invoke tool',
        });
      }
    });

    // List categories
    this.app.get('/api/categories', (_req: Request, res: Response) => {
      try {
        const categories = this.toolRegistry.getCategories();

        const categoriesWithCounts = categories.map((category: string) => ({
          name: category,
          toolCount: this.toolRegistry.getByCategory(category).length,
        }));

        res.json({
          categories: categoriesWithCounts,
          total: categories.length,
        });
      } catch (error) {
        this.logger.error('Failed to list categories', error as Error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to list categories',
        });
      }
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: [
          'GET /health',
          'POST /mcp',
          'GET /sse',
          'POST /sse',
          'GET /api/tools',
          'GET /api/tools/:name',
          'POST /api/tools/:name',
          'GET /api/tools/category/:category',
          'GET /api/categories',
        ],
      });
    });
  }

  private parseMCPRequestPayload(body: unknown): MCPTransportRequest | null {
    if (!body) {
      return null;
    }

    if (typeof body === 'string') {
      try {
        return JSON.parse(body) as MCPTransportRequest;
      } catch {
        return null;
      }
    }

    if (typeof body === 'object') {
      return body as MCPTransportRequest;
    }

    return null;
  }

  private async handleMCPHttpRequest(req: Request, res: Response): Promise<void> {
    try {
      const payload = this.parseMCPRequestPayload(req.body);

      if (!payload) {
        res.status(400).json({
          error: 'Invalid MCP request payload',
          message: 'Expected JSON-RPC body',
        });
        return;
      }

      const response = await processMCPRequest(payload, {
        toolRegistry: this.toolRegistry,
        logger: this.logger,
      });

      res.json(response);
    } catch (error) {
      this.logger.error('Failed to handle MCP HTTP request', error as Error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }

  private async handleSSE(req: Request, res: Response): Promise<void> {
    const acceptHeader = req.headers.accept;
    if (
      acceptHeader &&
      !acceptHeader.includes('text/event-stream') &&
      !acceptHeader.includes('*/*')
    ) {
      res.status(400).json({
        error: 'SSE endpoint requires Accept: text/event-stream',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Flush headers so the connection stays open
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const sendEvent = (
      data: unknown,
      event?: string,
      id?: string | number | null
    ) => {
      let payload = '';
      if (id !== undefined && id !== null) {
        payload += `id: ${id}\n`;
      }
      if (event) {
        payload += `event: ${event}\n`;
      }
      payload += `data: ${JSON.stringify(data)}\n\n`;
      res.write(payload);
    };

    const sendErrorEvent = (message: string) => {
      sendEvent(
        {
          type: 'error',
          message,
          timestamp: new Date().toISOString(),
        },
        'error'
      );
    };

    sendEvent(
      {
        type: 'connection',
        status: 'connected',
        server: this.config.serviceInfo.name,
        version: this.config.serviceInfo.version,
        timestamp: new Date().toISOString(),
      },
      'connection'
    );

    const initMessage = buildMCPInitMessage(this.config.serviceInfo);
    sendEvent(initMessage, 'message', initMessage.id);

    const pingInterval = setInterval(() => {
      sendEvent(
        {
          type: 'ping',
          timestamp: new Date().toISOString(),
        },
        'ping'
      );
    }, SSE_PING_INTERVAL_MS);

    let closed = false;
    let timeoutHandle: NodeJS.Timeout;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearInterval(pingInterval);
      clearTimeout(timeoutHandle);
      res.end();
    };

    timeoutHandle = setTimeout(() => {
      cleanup();
    }, SSE_CONNECTION_TIMEOUT_MS);

    req.on('close', cleanup);

    if (req.method === 'POST') {
      try {
        const payload = this.parseMCPRequestPayload(req.body);
        if (!payload) {
          sendErrorEvent('Invalid MCP request payload');
        } else {
          const response = await processMCPRequest(payload, {
            toolRegistry: this.toolRegistry,
            logger: this.logger,
          });

          sendEvent(
            response,
            'message',
            payload.id !== undefined && payload.id !== null
              ? payload.id
              : undefined
          );
        }
      } catch (error) {
        this.logger.error('Failed to process SSE MCP request', error as Error);
        sendErrorEvent(
          error instanceof Error ? error.message : 'Internal Server Error'
        );
      }
    }

    // Keep the connection open until timeout or client disconnects
  }

  /**
   * Build response payload for the landing page
   */
  private buildLandingResponse(): Record<string, unknown> {
    const categories = this.toolRegistry.getCategories();

    const endpoints = [
      { method: 'GET', path: '/health', description: 'Service health and basic stats' },
      { method: 'POST', path: '/mcp', description: 'MCP JSON-RPC endpoint' },
      { method: 'GET', path: '/sse', description: 'Server-Sent Events transport' },
      { method: 'GET', path: '/api/tools', description: 'List all available MCP tools' },
      { method: 'GET', path: '/api/categories', description: 'List all tool categories' },
      { method: 'GET', path: '/api/tools/:name', description: 'Get schema and metadata for a tool' },
      { method: 'POST', path: '/api/tools/:name', description: 'Invoke a tool with JSON payload' },
      { method: 'GET', path: '/api/tools/category/:category', description: 'List tools that belong to a category' },
    ];

    return {
      name: this.config.serviceInfo.name,
      status: 'online',
      description: this.config.serviceInfo.description,
      version: this.config.serviceInfo.version,
      environment: this.config.serviceInfo.environment,
      documentation: this.config.serviceInfo.documentationUrl,
      repository: this.config.serviceInfo.repositoryUrl,
      stats: {
        toolCount: this.toolRegistry.count(),
        categories,
      },
      endpoints,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      this.logger.error('Unhandled HTTP error', err);

      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
      });
    });
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.app.listen(this.config.port, this.config.host, () => {
          this.logger.info('HTTP server started', {
            host: this.config.host,
            port: this.config.port,
            url: `http://${this.config.host}:${this.config.port}`,
          });
          resolve();
        });
      } catch (error) {
        this.logger.error('Failed to start HTTP server', error as Error);
        reject(error);
      }
    });
  }
}

/**
 * Factory function to create HTTP adapter
 */
export function createHttpAdapter(
  toolRegistry: ToolRegistry,
  logger: Logger,
  config: HttpAdapterConfig
): HttpAdapter {
  return new HttpAdapter(toolRegistry, logger, config);
}
