import type {
  Logger,
  ServiceInfo,
  ToolDefinition,
  MCPTransportRequest,
  MCPTransportResponse,
} from '../types/index.js';
import type { ToolRegistry } from './tools.js';

const JSONRPC_VERSION = '2.0';
export const MCP_PROTOCOL_VERSION = '2024-11-05';

function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): MCPTransportResponse {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

function serializeTools(tools: ToolDefinition[]): Array<Record<string, unknown>> {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    category: tool.category,
  }));
}

export interface MCPHandlerContext {
  toolRegistry: ToolRegistry;
  logger: Logger;
}

export async function processMCPRequest(
  request: MCPTransportRequest,
  context: MCPHandlerContext
): Promise<MCPTransportResponse> {
  if (!request || typeof request !== 'object') {
    return createErrorResponse(null, -32600, 'Invalid request payload');
  }

  const id = request.id ?? null;
  const method = request.method;

  switch (method) {
    case 'initialize': {
      // MCP handshake - return server capabilities
      return {
        jsonrpc: request.jsonrpc || JSONRPC_VERSION,
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {
            tools: {},
            resources: {
              subscribe: false,
              listChanged: false,
            },
            logging: {},
          },
          serverInfo: {
            name: 'mcp-senado',
            version: '1.0.0',
          },
        },
      };
    }

    case 'initialized': {
      // Notification that initialization is complete (no response needed for notifications)
      return {
        jsonrpc: request.jsonrpc || JSONRPC_VERSION,
        id,
        result: null,
      };
    }

    case 'ping': {
      // Health check via JSON-RPC
      return {
        jsonrpc: request.jsonrpc || JSONRPC_VERSION,
        id,
        result: {},
      };
    }

    case 'tools/list': {
      const tools = serializeTools(context.toolRegistry.getAll());
      return {
        jsonrpc: request.jsonrpc || JSONRPC_VERSION,
        id,
        result: {
          tools,
        },
      };
    }

    case 'tools/call': {
      if (!request.params || typeof request.params !== 'object') {
        return createErrorResponse(id, -32602, 'Invalid params', 'Expected object with name and arguments');
      }

      const params = request.params as { name?: string; arguments?: unknown };
      if (!params.name || typeof params.name !== 'string') {
        return createErrorResponse(id, -32602, 'Invalid params', 'Tool name is required');
      }

      const toolName = params.name;
      const toolArgs = params.arguments ?? {};

      try {
        const result = await context.toolRegistry.invoke(
          toolName,
          toolArgs,
          {} as any
        );

        return {
          jsonrpc: request.jsonrpc || JSONRPC_VERSION,
          id,
          result,
        };
      } catch (error) {
        context.logger.error('MCP tool invocation failed', error as Error, {
          tool: toolName,
        });

        return createErrorResponse(
          id,
          -32603,
          'Tool execution failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    case 'resources/list': {
      // List available resources (data endpoints)
      const resources = [
        {
          uri: 'senado://reference/legislaturas',
          name: 'Legislaturas do Senado Federal',
          description: 'Lista completa de todas as legislaturas',
          mimeType: 'application/json',
        },
        {
          uri: 'senado://reference/ufs',
          name: 'Estados Brasileiros',
          description: 'Lista de todos os estados e o Distrito Federal',
          mimeType: 'application/json',
        },
        {
          uri: 'senado://reference/tipos-materia',
          name: 'Tipos de Matéria Legislativa',
          description: 'Lista de tipos de proposições legislativas',
          mimeType: 'application/json',
        },
        {
          uri: 'senado://reference/partidos',
          name: 'Partidos Políticos',
          description: 'Lista de partidos políticos brasileiros',
          mimeType: 'application/json',
        },
      ];

      return {
        jsonrpc: request.jsonrpc || JSONRPC_VERSION,
        id,
        result: {
          resources,
        },
      };
    }

    case 'resources/read': {
      if (!request.params || typeof request.params !== 'object') {
        return createErrorResponse(id, -32602, 'Invalid params', 'Expected object with uri');
      }

      const params = request.params as { uri?: string };
      if (!params.uri || typeof params.uri !== 'string') {
        return createErrorResponse(id, -32602, 'Invalid params', 'Resource URI is required');
      }

      const uri = params.uri;

      // Map resource URIs to tool calls
      const resourceToolMap: Record<string, string> = {
        'senado://reference/legislaturas': 'legislaturas_listar',
        'senado://reference/ufs': 'ufs_listar',
        'senado://reference/tipos-materia': 'tipos_materia_listar',
        'senado://reference/partidos': 'partidos_listar',
      };

      const toolName = resourceToolMap[uri];
      if (!toolName) {
        return createErrorResponse(id, -32602, 'Invalid resource URI', `Unknown resource: ${uri}`);
      }

      try {
        // Invoke the corresponding tool
        const result = await context.toolRegistry.invoke(
          toolName,
          {},
          {} as any
        );

        return {
          jsonrpc: request.jsonrpc || JSONRPC_VERSION,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                ...result,
              },
            ],
          },
        };
      } catch (error) {
        context.logger.error('MCP resource read failed', error as Error, {
          uri,
          tool: toolName,
        });

        return createErrorResponse(
          id,
          -32603,
          'Resource read failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    default:
      return createErrorResponse(
        id,
        -32601,
        'Method not found',
        `Unknown method: ${method}`
      );
  }
}

export function buildMCPInitMessage(serviceInfo: ServiceInfo) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id: 'init',
    result: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: serviceInfo.name,
        version: serviceInfo.version,
      },
    },
  };
}
