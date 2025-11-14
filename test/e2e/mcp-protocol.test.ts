/**
 * E2E Tests for MCP Protocol
 *
 * Tests the complete MCP server protocol integration including:
 * - Server initialization
 * - List tools protocol
 * - Call tool protocol
 * - Error handling
 * - Rate limiting
 * - Caching behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { createMCPServer } from '../../lib/core/mcp-server.js';
import { createToolRegistry } from '../../lib/core/tools.js';
import { createLogger } from '../../lib/infrastructure/logger.js';
import { createCache } from '../../lib/infrastructure/cache.js';
import { createRateLimiter } from '../../lib/infrastructure/rate-limiter.js';
import { referenceTools } from '../../lib/tools/reference-tools.js';

import type { MCPServerConfig, HttpClient, Logger } from '../../lib/types/index.js';

// Mock HTTP client for testing
function createMockHttpClient(): HttpClient {
  return {
    get: vi.fn().mockResolvedValue({
      success: true,
      data: {
        ListaUFs: {
          UFs: {
            UF: [
              {
                Codigo: '26',
                Nome: 'São Paulo',
                Sigla: 'SP',
              },
              {
                Codigo: '19',
                Nome: 'Rio de Janeiro',
                Sigla: 'RJ',
              },
            ],
          },
        },
      },
    }),
    post: vi.fn(),
  };
}

// Create test configuration
function createTestConfig(): MCPServerConfig {
  return {
    name: 'mcp-senado-test',
    version: '0.1.0',
    transport: 'stdio',
    httpPort: 3000,
    httpHost: 'localhost',
    apiBaseUrl: 'https://legis.senado.leg.br/dadosabertos/',
    apiTimeout: 30000,
    apiMaxRetries: 3,
    apiRetryDelay: 1000,
    cacheEnabled: true,
    cacheTTL: 300000,
    cacheMaxSize: 1000,
    cacheCleanupInterval: 60000,
    rateLimitEnabled: true,
    rateLimitTokens: 30,
    rateLimitInterval: 60000,
    rateLimitRefillRate: 0.5,
    circuitBreakerEnabled: true,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerSuccessThreshold: 2,
    circuitBreakerTimeout: 60000,
    logLevel: 'INFO' as any,
    logFormat: 'json',
    logMaskPII: false,
    corsEnabled: false,
    corsOrigins: '*',
    nodeEnv: 'test',
    debug: false,
  };
}

describe('MCP Protocol E2E Tests', () => {
  let client: Client;
  let logger: Logger;
  let config: MCPServerConfig;

  beforeEach(() => {
    config = createTestConfig();
    logger = createLogger({
      level: 'INFO' as any,
      format: 'json',
      maskPII: false,
    });
  });

  afterEach(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Server Initialization', () => {
    it('should initialize MCP server with all components', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      expect(server).toBeDefined();
      expect(server.getServer()).toBeDefined();
      expect(server.getToolRegistry()).toBe(toolRegistry);
      expect(server.getToolRegistry().count()).toBeGreaterThan(0);
    });

    it('should have correct server info', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const health = server.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.toolCount).toBe(referenceTools.length);
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('List Tools Protocol', () => {
    it('should list all registered tools via MCP protocol', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      // Create in-memory transport for testing
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

      // Connect server
      await server.getServer().connect(serverTransport);

      // Create client
      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      // List tools
      const response = await client.listTools();

      expect(response.tools).toBeDefined();
      expect(response.tools.length).toBe(referenceTools.length);

      // Check first tool structure
      const firstTool = response.tools[0];
      expect(firstTool.name).toBeDefined();
      expect(firstTool.description).toBeDefined();
      expect(firstTool.inputSchema).toBeDefined();
    });

    it('should include correct tool metadata', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      const response = await client.listTools();

      // Find a specific tool and verify metadata
      const ufsTool = response.tools.find((t) => t.name === 'ufs_listar');
      expect(ufsTool).toBeDefined();
      expect(ufsTool!.description).toContain('Lista');
      expect(ufsTool!.inputSchema).toBeDefined();
      expect(ufsTool!.inputSchema.type).toBe('object');
    });
  });

  describe('Call Tool Protocol', () => {
    it('should invoke a tool via MCP protocol', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      // Call tool
      const response = await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content[0].type).toBe('text');
      expect(response.isError).toBeUndefined();
    });

    it('should return tool result with correct structure', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      const response = await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      // Verify structure matches MCP protocol
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type');
      expect(response.content[0]).toHaveProperty('text');

      // Verify result contains expected data
      const resultText = (response.content[0] as any).text;
      expect(resultText).toContain('Estados Brasileiros');
      expect(resultText).toContain('São Paulo');
      expect(resultText).toContain('SP');
    });

    it('should handle tool invocation with arguments', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const mockHttpClient = createMockHttpClient();
      (mockHttpClient.get as any).mockResolvedValue({
        success: true,
        data: {
          ListaLegislaturas: {
            Legislaturas: {
              Legislatura: [
                {
                  NumeroLegislatura: '57',
                  DataInicio: '2023-02-01',
                  DataFim: '2027-01-31',
                },
              ],
            },
          },
        },
      });

      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        mockHttpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      const response = await client.callTool({
        name: 'legislaturas_listar',
        arguments: {
          pagina: 1,
          itensPorPagina: 10,
        },
      });

      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');

      // Verify HTTP client was called with params
      expect(mockHttpClient.get).toHaveBeenCalledWith('/legislatura/lista', {
        pagina: 1,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle tool not found error', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      const response = await client.callTool({
        name: 'nonexistent_tool',
        arguments: {},
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].type).toBe('text');
      const errorText = (response.content[0] as any).text;
      expect(errorText).toContain('Tool Not Found');
    });

    it('should handle validation errors', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      const response = await client.callTool({
        name: 'legislaturas_listar',
        arguments: {
          pagina: -1, // Invalid page number
        },
      });

      expect(response.isError).toBe(true);
      const errorText = (response.content[0] as any).text;
      expect(errorText).toContain('Validation Error');
    });

    it('should handle HTTP errors gracefully', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const mockHttpClient = createMockHttpClient();
      (mockHttpClient.get as any).mockRejectedValue(new Error('Network error'));

      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        mockHttpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      const response = await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      expect(response.isError).toBe(true);
      const errorText = (response.content[0] as any).text;
      expect(errorText).toContain('Network error');
    });
  });

  describe('Caching Behavior', () => {
    it('should cache tool results', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const mockHttpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        true // cache enabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        mockHttpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      // First call - should hit API
      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      // Should still be called once (cached)
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      // Verify cache stats
      const stats = server.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should not cache error results', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const mockHttpClient = createMockHttpClient();
      (mockHttpClient.get as any).mockRejectedValue(new Error('API error'));

      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        true
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        mockHttpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      // First call - error
      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      // Second call - should call API again (not cached)
      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      // Should be called twice (errors not cached)
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track tool invocations', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const httpClient = createMockHttpClient();
      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        httpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      // Initial stats
      const initialStats = server.getStats();
      expect(initialStats.toolInvocations).toBe(0);

      // Call tool twice
      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      // Check updated stats
      const updatedStats = server.getStats();
      expect(updatedStats.toolInvocations).toBe(2);
      expect(updatedStats.uptime).toBeGreaterThan(0);
    });

    it('should track error count', async () => {
      const toolRegistry = createToolRegistry();
      toolRegistry.registerMany(referenceTools);

      const mockHttpClient = createMockHttpClient();
      (mockHttpClient.get as any).mockRejectedValue(new Error('Test error'));

      const cache = createCache(
        {
          ttl: config.cacheTTL,
          maxSize: config.cacheMaxSize,
          cleanupInterval: config.cacheCleanupInterval,
        },
        logger,
        config.cacheEnabled
      );
      const rateLimiter = createRateLimiter(
        {
          tokens: config.rateLimitTokens,
          interval: config.rateLimitInterval,
          refillRate: config.rateLimitRefillRate,
        },
        logger,
        config.rateLimitEnabled
      );

      const server = createMCPServer(
        config,
        logger,
        toolRegistry,
        mockHttpClient,
        cache,
        rateLimiter
      );

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverTransport);

      client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(clientTransport);

      // Cause error
      await client.callTool({
        name: 'ufs_listar',
        arguments: {},
      });

      const stats = server.getStats();
      expect(stats.errors).toBe(1);
    });
  });
});
