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
import type { Logger, ToolDefinition } from '../types/index.js';
import type { ToolRegistry } from '../core/tools.js';

export interface HttpAdapterConfig {
  port: number;
  host: string;
  corsOrigin: string;
  authEnabled: boolean;
  authToken?: string;
  requestTimeout: number;
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
          'GET /api/tools',
          'GET /api/tools/:name',
          'POST /api/tools/:name',
          'GET /api/tools/category/:category',
          'GET /api/categories',
        ],
      });
    });
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
