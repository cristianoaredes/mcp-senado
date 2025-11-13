/**
 * Cloudflare Workers Adapter for MCP Senado Server
 *
 * Provides edge deployment capabilities using Cloudflare Workers
 * Features:
 * - RESTful endpoints for all tools
 * - CORS support
 * - Request authentication
 * - Global edge deployment
 * - Low latency worldwide
 */

import type { Logger, ToolDefinition } from '../types/index.js';
import type { ToolRegistry } from '../core/tools.js';

export interface WorkersAdapterConfig {
  corsOrigin: string;
  authEnabled: boolean;
  authToken?: string;
}

/**
 * Cloudflare Workers adapter that wraps the MCP server
 */
export class WorkersAdapter {
  private toolRegistry: ToolRegistry;
  private logger: Logger;
  private config: WorkersAdapterConfig;

  constructor(
    toolRegistry: ToolRegistry,
    logger: Logger,
    config: WorkersAdapterConfig
  ) {
    this.toolRegistry = toolRegistry;
    this.logger = logger;
    this.config = config;
  }

  /**
   * Handle incoming fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return this.corsResponse();
      }

      // Authenticate if enabled
      if (this.config.authEnabled && !this.authenticate(request)) {
        return this.errorResponse('Unauthorized', 401);
      }

      // Route to handlers
      if (path === '/health' && method === 'GET') {
        return this.handleHealth();
      }

      if (path === '/api/tools' && method === 'GET') {
        return this.handleListTools();
      }

      if (path === '/api/categories' && method === 'GET') {
        return this.handleListCategories();
      }

      // Match /api/tools/:name
      const toolMatch = path.match(/^\/api\/tools\/([^/]+)$/);
      if (toolMatch) {
        const toolName = toolMatch[1]!; // Safe: regex ensures this exists

        if (method === 'GET') {
          return this.handleGetTool(toolName);
        }

        if (method === 'POST') {
          return this.handleInvokeTool(request, toolName);
        }
      }

      // Match /api/tools/category/:category
      const categoryMatch = path.match(/^\/api\/tools\/category\/([^/]+)$/);
      if (categoryMatch && method === 'GET') {
        const category = categoryMatch[1]!; // Safe: regex ensures this exists
        return this.handleGetToolsByCategory(category);
      }

      return this.errorResponse('Not Found', 404);
    } catch (error) {
      this.logger.error('Workers request failed', error as Error);
      return this.errorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        500
      );
    }
  }

  /**
   * Health check endpoint
   */
  private handleHealth(): Response {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tools: this.toolRegistry.count(),
      categories: this.toolRegistry.getCategories(),
    };

    return this.jsonResponse(health);
  }

  /**
   * List all tools
   */
  private handleListTools(): Response {
    const tools = this.toolRegistry.getAll();

    const toolsList = tools.map((tool: ToolDefinition) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      inputSchema: tool.inputSchema,
    }));

    return this.jsonResponse({
      tools: toolsList,
      total: toolsList.length,
    });
  }

  /**
   * List all categories
   */
  private handleListCategories(): Response {
    const categories = this.toolRegistry.getCategories();

    const categoriesWithCounts = categories.map((category: string) => ({
      name: category,
      toolCount: this.toolRegistry.getByCategory(category).length,
    }));

    return this.jsonResponse({
      categories: categoriesWithCounts,
      total: categories.length,
    });
  }

  /**
   * Get specific tool details
   */
  private handleGetTool(name: string): Response {
    if (!this.toolRegistry.has(name)) {
      return this.errorResponse(`Tool not found: ${name}`, 404);
    }

    const tool = this.toolRegistry.get(name);

    return this.jsonResponse({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      inputSchema: tool.inputSchema,
    });
  }

  /**
   * Get tools by category
   */
  private handleGetToolsByCategory(category: string): Response {
    const tools = this.toolRegistry.getByCategory(category);

    const toolsList = tools.map((tool: ToolDefinition) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      inputSchema: tool.inputSchema,
    }));

    return this.jsonResponse({
      category,
      tools: toolsList,
      total: toolsList.length,
    });
  }

  /**
   * Invoke a tool
   */
  private async handleInvokeTool(request: Request, name: string): Promise<Response> {
    if (!this.toolRegistry.has(name)) {
      return this.errorResponse(`Tool not found: ${name}`, 404);
    }

    try {
      // Parse request body
      const args = await request.json();

      // Invoke tool (context will be provided by the worker environment)
      const result = await this.toolRegistry.invoke(name, args, {} as any);

      return this.jsonResponse(result);
    } catch (error) {
      this.logger.error('Failed to invoke tool', error as Error);
      return this.errorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        500
      );
    }
  }

  /**
   * Check authentication
   */
  private authenticate(request: Request): boolean {
    if (!this.config.authEnabled) {
      return true;
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return false;
    }

    const token = authHeader.replace('Bearer ', '');
    return token === this.config.authToken;
  }

  /**
   * Create CORS response
   */
  private corsResponse(): Response {
    return new Response(null, {
      status: 200,
      headers: this.getCorsHeaders(),
    });
  }

  /**
   * Create JSON response
   */
  private jsonResponse(data: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...this.getCorsHeaders(),
      },
    });
  }

  /**
   * Create error response
   */
  private errorResponse(message: string, status: number): Response {
    return this.jsonResponse({ error: message }, status);
  }

  /**
   * Get CORS headers
   */
  private getCorsHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': this.config.corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
}

/**
 * Create Workers adapter
 */
export function createWorkersAdapter(
  toolRegistry: ToolRegistry,
  logger: Logger,
  config: WorkersAdapterConfig
): WorkersAdapter {
  return new WorkersAdapter(toolRegistry, logger, config);
}
