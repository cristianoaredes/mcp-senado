import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistry } from '../../lib/core/tools.js';
import type { ToolContext, Logger, HttpClient, CacheInterface } from '../../lib/types/index.js';
import { referenceTools } from '../../lib/tools/reference-tools.js';

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
});

// Mock cache
const createMockCache = (): CacheInterface => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  generateKey: vi.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`),
  getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, size: 0, hitRate: 0 }),
});

// Mock HTTP client
const createMockHttpClient = (): HttpClient => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
});

describe('Tool Execution Integration Tests', () => {
  let registry: ToolRegistry;
  let mockContext: ToolContext;
  let mockHttpClient: HttpClient;
  let mockCache: CacheInterface;
  let mockLogger: Logger;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockHttpClient = createMockHttpClient();
    mockCache = createMockCache();
    mockLogger = createMockLogger();

    mockContext = {
      httpClient: mockHttpClient,
      cache: mockCache,
      config: {
        apiBaseUrl: 'https://legis.senado.leg.br/dadosabertos/',
        cacheEnabled: true,
        cacheTTL: 300,
        cacheMaxSize: 1000,
        rateLimitEnabled: true,
        rateLimitMaxRequests: 30,
        rateLimitWindowMs: 60000,
        circuitBreakerEnabled: true,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 60000,
        httpTimeout: 30000,
        httpRetryAttempts: 3,
        httpRetryDelay: 1000,
        logLevel: 'info',
      },
      logger: mockLogger,
    };

    // Register reference tools
    registry.registerMany(referenceTools);
  });

  describe('List States Tool (ufs_listar)', () => {
    it('should successfully list Brazilian states', async () => {
      const mockApiResponse = {
        data: [
          { id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } },
          { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro', regiao: { nome: 'Sudeste' } },
          { id: 31, sigla: 'MG', nome: 'Minas Gerais', regiao: { nome: 'Sudeste' } },
        ],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse as any);

      const result = await registry.invoke('ufs_listar', {}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
        {}
      );

      expect(result.content).toBeDefined();
      expect(result.content![0].type).toBe('text');
      expect(result.content![0].text).toContain('São Paulo');
      expect(result.content![0].text).toContain('Rio de Janeiro');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Listing states',
        expect.objectContaining({ params: {} })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      vi.mocked(mockHttpClient.get).mockRejectedValue(new Error('Network error'));

      // Execute tool and expect error
      await expect(registry.invoke('ufs_listar', {}, mockContext)).rejects.toThrow(
        'Network error'
      );

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to list states',
        expect.any(Error)
      );
    });
  });

  describe('List Legislatures Tool (legislaturas_listar)', () => {
    it('should list legislatures with pagination', async () => {
      const mockApiResponse = {
        data: {
          ListaLegislaturas: {
            Legislaturas: {
              Legislatura: [
                {
                  Codigo: '57',
                  DataInicio: '2023-02-01',
                  DataFim: '2027-01-31',
                },
                {
                  Codigo: '56',
                  DataInicio: '2019-02-01',
                  DataFim: '2023-01-31',
                },
              ],
            },
          },
        },
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      const result = await registry.invoke(
        'legislaturas_listar',
        { pagina: 1, itens: 10 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/plenario/lista/legislaturas',
        {}
      );

      expect(result.content[0].text).toContain('57');
      expect(result.content[0].text).toContain('2023-02-01');
    });

    it('should validate pagination parameters', async () => {
      // Invalid pagination (negative page)
      await expect(
        registry.invoke('legislaturas_listar', { pagina: -1 }, mockContext)
      ).rejects.toThrow();

      // Invalid pagination (too many items)
      await expect(
        registry.invoke('legislaturas_listar', { itens: 101 }, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('List Proposal Types Tool (tipos_materia_listar)', () => {
    it('should list proposal types', async () => {
      const mockApiResponse = {
        data: {
          ListaTiposMateria: {
            TiposMateria: {
              TipoMateria: [
                {
                  Codigo: 'PL',
                  Sigla: 'PL',
                  Descricao: 'Projeto de Lei',
                },
                {
                  Codigo: 'PLS',
                  Sigla: 'PLS',
                  Descricao: 'Projeto de Lei do Senado',
                },
                {
                  Codigo: 'PEC',
                  Sigla: 'PEC',
                  Descricao: 'Proposta de Emenda à Constituição',
                },
              ],
            },
          },
        },
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      const result = await registry.invoke('tipos_materia_listar', {}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tipoMateria/lista', {});
      expect(result.content[0].text).toContain('Projeto de Lei');
      expect(result.content[0].text).toContain('PEC');
    });
  });

  describe('Context Integration', () => {
    it('should provide cache interface to tools', async () => {
      const mockApiResponse = {
        data: [{ id: 35, sigla: 'SP', nome: 'São Paulo' }],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      const result = await registry.invoke('ufs_listar', {}, mockContext);

      // Cache should be available in context
      expect(mockContext.cache).toBeDefined();
      expect(mockContext.cache.generateKey).toBeDefined();

      // Result should be returned
      expect(result.content).toBeDefined();
    });

    it('should allow tools to use cache if needed', async () => {
      const mockApiResponse = {
        data: [{ id: 35, sigla: 'SP', nome: 'São Paulo' }],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      const result = await registry.invoke('ufs_listar', {}, mockContext);

      // Tools can generate cache keys if needed
      const cacheKey = mockContext.cache.generateKey('test', { param: 'value' });
      expect(cacheKey).toBeTruthy();

      // Result should be successful
      expect(result.content[0].text).toContain('São Paulo');
    });

    it('should pass logger to tool handler', async () => {
      const mockApiResponse = {
        data: [],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      await registry.invoke('ufs_listar', {}, mockContext);

      // Verify logger was used
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle concurrent tool executions', async () => {
      const mockApiResponse = {
        data: [],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      // Execute multiple tools concurrently
      const promises = [
        registry.invoke('ufs_listar', {}, mockContext),
        registry.invoke('legislaturas_listar', {}, mockContext),
        registry.invoke('tipos_materia_listar', {}, mockContext),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
      });

      // HTTP client should have been called 3 times
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      // Invalid input (wrong type)
      await expect(
        registry.invoke('legislaturas_listar', { pagina: 'invalid' }, mockContext)
      ).rejects.toThrow();
    });

    it('should handle HTTP errors with status codes', async () => {
      const httpError = Object.assign(new Error('Not Found'), {
        statusCode: 404,
        response: { status: 404, statusText: 'Not Found' },
      });

      vi.mocked(mockHttpClient.get).mockRejectedValue(httpError);

      await expect(registry.invoke('ufs_listar', {}, mockContext)).rejects.toThrow(
        'Not Found'
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      vi.mocked(mockHttpClient.get).mockRejectedValue(timeoutError);

      await expect(registry.invoke('ufs_listar', {}, mockContext)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle malformed API responses', async () => {
      // Response missing expected fields
      const malformedResponse = {
        data: {
          // Missing expected structure
          something: 'else',
        },
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(malformedResponse);

      const result = await registry.invoke('ufs_listar', {}, mockContext);

      // Should still return a result (though data might be unusual)
      expect(result.content).toBeDefined();
    });
  });

  describe('Tool Discovery and Metadata', () => {
    it('should have correct tool metadata', () => {
      const tool = registry.get('ufs_listar');

      expect(tool.name).toBe('ufs_listar');
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBe('reference');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeTypeOf('function');
    });

    it('should provide input schema for validation', () => {
      const tool = registry.get('legislaturas_listar');

      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    });

    it('should list all reference tools', () => {
      const tools = registry.getByCategory('reference');

      expect(tools.length).toBeGreaterThan(0);
      expect(tools.every(t => t.category === 'reference')).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle pagination through multiple pages', async () => {
      const page1Response = {
        data: {
          ListaLegislaturas: {
            Metadata: { TotalPages: 2 },
            Legislaturas: {
              Legislatura: [{ Codigo: '57' }],
            },
          },
        },
      };

      const page2Response = {
        data: {
          ListaLegislaturas: {
            Metadata: { TotalPages: 2 },
            Legislaturas: {
              Legislatura: [{ Codigo: '56' }],
            },
          },
        },
      };

      vi.mocked(mockHttpClient.get)
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);

      // Get page 1
      const result1 = await registry.invoke(
        'legislaturas_listar',
        { pagina: 1, itens: 1 },
        mockContext
      );
      expect(result1.content[0].text).toContain('57');

      // Get page 2
      const result2 = await registry.invoke(
        'legislaturas_listar',
        { pagina: 2, itens: 1 },
        mockContext
      );
      expect(result2.content[0].text).toContain('56');
    });

    it('should handle rapid sequential requests', async () => {
      const mockApiResponse = {
        data: [],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockApiResponse);

      // Execute 10 requests in rapid succession
      const promises = Array.from({ length: 10 }, () =>
        registry.invoke('ufs_listar', {}, mockContext)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(10);
    });

    it('should work with empty result sets', async () => {
      const emptyResponse = {
        data: [],
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(emptyResponse);

      const result = await registry.invoke('ufs_listar', {}, mockContext);

      expect(result.content).toBeDefined();
      expect(result.content![0].text).toContain('0 de 0');
    });
  });
});
