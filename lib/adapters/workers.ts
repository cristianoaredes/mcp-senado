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

export interface WorkersAdapterConfig {
  corsOrigin: string;
  authEnabled: boolean;
  authToken?: string;
  serviceInfo: ServiceInfo;
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
      if ((path === '/' || path === '') && method === 'GET') {
        return this.handleLanding();
      }

      if (path === '/mcp' && method === 'POST') {
        return this.handleMCP(request);
      }

      if (path === '/sse' && (method === 'GET' || method === 'POST')) {
        return this.handleSSE(request);
      }

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
   * Landing page information
   */
  private handleLanding(): Response {
    return this.jsonResponse(this.buildLandingPayload());
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

  private parseMCPRequestBody(body: string | null): MCPTransportRequest | null {
    if (!body) {
      return null;
    }

    try {
      return JSON.parse(body) as MCPTransportRequest;
    } catch {
      return null;
    }
  }

  private async handleMCP(request: Request): Promise<Response> {
    try {
      const bodyText = await request.text();
      const payload = this.parseMCPRequestBody(bodyText);

      if (!payload) {
        return this.jsonResponse(
          {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error',
              data: 'Invalid JSON in request body',
            },
          },
          400
        );
      }

      const response = await processMCPRequest(payload, {
        toolRegistry: this.toolRegistry,
        logger: this.logger,
      });

      return this.jsonResponse(response);
    } catch (error) {
      this.logger.error('Workers MCP request failed', error as Error);
      return this.jsonResponse(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        500
      );
    }
  }

  private handleSSE(request: Request): Response {
    const acceptHeader = request.headers.get('Accept');
    if (
      acceptHeader &&
      !acceptHeader.includes('text/event-stream') &&
      !acceptHeader.includes('*/*')
    ) {
      return new Response('SSE endpoint requires Accept: text/event-stream', {
        status: 400,
        headers: this.getCorsHeaders(),
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeEvent = async (
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
      await writer.write(encoder.encode(payload));
    };

    const sendError = async (message: string) => {
      await writeEvent(
        {
          type: 'error',
          message,
          timestamp: new Date().toISOString(),
        },
        'error'
      );
    };

    const run = async () => {
      try {
        await writeEvent(
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
        await writeEvent(initMessage, 'message', initMessage.id);

        const pingInterval = setInterval(() => {
          writeEvent(
            {
              type: 'ping',
              timestamp: new Date().toISOString(),
            },
            'ping'
          ).catch((error) => {
            this.logger.warn('Failed to send SSE ping', { error });
          });
        }, SSE_PING_INTERVAL_MS);

        const abortSignal = request.signal;
        let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

        const closeStream = () => {
          clearInterval(pingInterval);
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          if (abortSignal) {
            abortSignal.removeEventListener('abort', abortHandler);
          }
          writer.close().catch(() => {
            // Ignore close errors
          });
        };

        const abortHandler = () => {
          closeStream();
        };

        if (abortSignal) {
          abortSignal.addEventListener('abort', abortHandler, { once: true });
        }

        timeoutHandle = setTimeout(() => {
          closeStream();
        }, SSE_CONNECTION_TIMEOUT_MS);

        if (request.method === 'POST') {
          const bodyText = await request.text();
          const payload = this.parseMCPRequestBody(bodyText);
          if (!payload) {
            await sendError('Invalid MCP request payload');
          } else {
            try {
              const response = await processMCPRequest(payload, {
                toolRegistry: this.toolRegistry,
                logger: this.logger,
              });

              await writeEvent(
                response,
                'message',
                payload.id !== undefined && payload.id !== null
                  ? payload.id
                  : undefined
              );
            } catch (error) {
              this.logger.error('Failed to process SSE MCP request', error as Error);
              await sendError(
                error instanceof Error ? error.message : 'Internal Server Error'
              );
            }
          }
        }
      } catch (error) {
        this.logger.error('SSE handler failed', error as Error);
        await sendError('Internal Server Error');
      }
    };

    void run();

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...this.getCorsHeaders(),
    };

    return new Response(readable, {
      status: 200,
      headers,
    });
  }

  private buildLandingPayload(): Record<string, unknown> {
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
