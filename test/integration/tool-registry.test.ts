import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistry } from '../../lib/core/tools.js';
import type { ToolDefinition, ToolContext, Logger, HttpClient } from '../../lib/types/index.js';
import { ToolNotFoundError } from '../../lib/core/errors.js';

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
});

// Mock HTTP client
const createMockHttpClient = (): HttpClient => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
});

describe('ToolRegistry Integration Tests', () => {
  let registry: ToolRegistry;
  let mockContext: ToolContext;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockContext = {
      httpClient: createMockHttpClient(),
      cache: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        generateKey: vi.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`),
        getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, size: 0, hitRate: 0 }),
      },
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
      logger: createMockLogger(),
    };
  });

  describe('Tool Registration', () => {
    it('should register a single tool', () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'A test tool',
        category: 'test',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
      };

      registry.register(tool);

      expect(registry.has('test_tool')).toBe(true);
      expect(registry.count()).toBe(1);
    });

    it('should register multiple tools', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: 'Tool 1',
          category: 'category1',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result1' }] }),
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          category: 'category1',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result2' }] }),
        },
        {
          name: 'tool3',
          description: 'Tool 3',
          category: 'category2',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result3' }] }),
        },
      ];

      registry.registerMany(tools);

      expect(registry.count()).toBe(3);
      expect(registry.getCategories()).toEqual(['category1', 'category2']);
      expect(registry.countByCategory('category1')).toBe(2);
      expect(registry.countByCategory('category2')).toBe(1);
    });

    it('should throw error for duplicate tool registration', () => {
      const tool: ToolDefinition = {
        name: 'duplicate_tool',
        description: 'A tool',
        category: 'test',
        inputSchema: { type: 'object', properties: {} },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
      };

      registry.register(tool);

      expect(() => registry.register(tool)).toThrow('Tool already registered: duplicate_tool');
    });

    it('should validate tool definition', () => {
      const invalidTool = {
        name: 'invalid',
        // Missing required fields
      } as ToolDefinition;

      expect(() => registry.register(invalidTool)).toThrow('Invalid tool definition');
    });

    it('should organize tools by category', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'ref1',
          description: 'Reference 1',
          category: 'reference',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
        {
          name: 'ref2',
          description: 'Reference 2',
          category: 'reference',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
        {
          name: 'sen1',
          description: 'Senator 1',
          category: 'senator',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
      ];

      registry.registerMany(tools);

      expect(registry.getByCategory('reference')).toHaveLength(2);
      expect(registry.getByCategory('senator')).toHaveLength(1);
      expect(registry.getByCategory('nonexistent')).toHaveLength(0);
    });
  });

  describe('Tool Retrieval', () => {
    beforeEach(() => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool_a',
          description: 'Tool A',
          category: 'cat1',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'a' }] }),
        },
        {
          name: 'tool_b',
          description: 'Tool B',
          category: 'cat1',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'b' }] }),
        },
        {
          name: 'tool_c',
          description: 'Tool C',
          category: 'cat2',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'c' }] }),
        },
      ];
      registry.registerMany(tools);
    });

    it('should get tool by name', () => {
      const tool = registry.get('tool_a');
      expect(tool.name).toBe('tool_a');
      expect(tool.description).toBe('Tool A');
    });

    it('should throw ToolNotFoundError for non-existent tool', () => {
      expect(() => registry.get('nonexistent')).toThrow(ToolNotFoundError);
    });

    it('should check if tool exists', () => {
      expect(registry.has('tool_a')).toBe(true);
      expect(registry.has('nonexistent')).toBe(false);
    });

    it('should get all tools', () => {
      const tools = registry.getAll();
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual(['tool_a', 'tool_b', 'tool_c']);
    });

    it('should list tool names', () => {
      const names = registry.listNames();
      expect(names).toEqual(['tool_a', 'tool_b', 'tool_c']);
    });

    it('should get categories', () => {
      const categories = registry.getCategories();
      expect(categories).toEqual(['cat1', 'cat2']);
    });

    it('should count tools', () => {
      expect(registry.count()).toBe(3);
      expect(registry.countByCategory('cat1')).toBe(2);
      expect(registry.countByCategory('cat2')).toBe(1);
      expect(registry.countByCategory('nonexistent')).toBe(0);
    });
  });

  describe('Tool Invocation', () => {
    it('should invoke tool and return result', async () => {
      const handler = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Success!' }],
      });

      const tool: ToolDefinition = {
        name: 'invoke_test',
        description: 'Test invocation',
        category: 'test',
        inputSchema: { type: 'object', properties: {} },
        handler,
      };

      registry.register(tool);

      const result = await registry.invoke('invoke_test', { param: 'value' }, mockContext);

      expect(handler).toHaveBeenCalledWith({ param: 'value' }, mockContext);
      expect(result.content).toEqual([{ type: 'text', text: 'Success!' }]);
    });

    it('should pass args and context to handler', async () => {
      const handler = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'result' }],
      });

      const tool: ToolDefinition = {
        name: 'context_test',
        description: 'Test context passing',
        category: 'test',
        inputSchema: { type: 'object', properties: {} },
        handler,
      };

      registry.register(tool);

      const args = { id: 123, name: 'test' };
      await registry.invoke('context_test', args, mockContext);

      expect(handler).toHaveBeenCalledWith(args, mockContext);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from handler', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));

      const tool: ToolDefinition = {
        name: 'error_test',
        description: 'Test error handling',
        category: 'test',
        inputSchema: { type: 'object', properties: {} },
        handler,
      };

      registry.register(tool);

      await expect(registry.invoke('error_test', {}, mockContext)).rejects.toThrow(
        'Handler error'
      );
    });

    it('should throw ToolNotFoundError when invoking non-existent tool', async () => {
      await expect(registry.invoke('nonexistent', {}, mockContext)).rejects.toThrow(
        ToolNotFoundError
      );
    });
  });

  describe('Tool Summary', () => {
    it('should generate comprehensive summary', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'ref1',
          description: 'Reference tool 1',
          category: 'reference',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
        {
          name: 'ref2',
          description: 'Reference tool 2',
          category: 'reference',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
        {
          name: 'sen1',
          description: 'Senator tool 1',
          category: 'senator',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
      ];

      registry.registerMany(tools);

      const summary = registry.getSummary();

      expect(summary).toContain('Tool Registry Summary');
      expect(summary).toContain('Total tools: 3');
      expect(summary).toContain('reference (2)');
      expect(summary).toContain('senator (1)');
      expect(summary).toContain('ref1: Reference tool 1');
      expect(summary).toContain('sen1: Senator tool 1');
    });
  });

  describe('Registry Management', () => {
    it('should clear all tools', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: 'Tool 1',
          category: 'cat1',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          category: 'cat1',
          inputSchema: { type: 'object', properties: {} },
          handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
        },
      ];

      registry.registerMany(tools);
      expect(registry.count()).toBe(2);

      registry.clear();

      expect(registry.count()).toBe(0);
      expect(registry.getCategories()).toHaveLength(0);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle complex tool with validation', async () => {
      const handler = vi.fn(async (args: any) => {
        // Simulate validation
        if (!args.id || typeof args.id !== 'number') {
          throw new Error('Invalid id parameter');
        }

        return {
          content: [
            {
              type: 'text',
              text: `Processed id: ${args.id}`,
            },
          ],
        };
      });

      const tool: ToolDefinition = {
        name: 'complex_tool',
        description: 'A complex tool with validation',
        category: 'test',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
          },
          required: ['id'],
        },
        handler,
      };

      registry.register(tool);

      // Valid invocation
      const result = await registry.invoke('complex_tool', { id: 42 }, mockContext);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Processed id: 42',
      });

      // Invalid invocation
      await expect(
        registry.invoke('complex_tool', { id: 'invalid' }, mockContext)
      ).rejects.toThrow('Invalid id parameter');
    });

    it('should handle multiple categories with many tools', () => {
      const categories = ['reference', 'senator', 'proposal', 'voting', 'committee'];
      const toolsPerCategory = 5;

      const tools: ToolDefinition[] = [];
      for (const category of categories) {
        for (let i = 1; i <= toolsPerCategory; i++) {
          tools.push({
            name: `${category}_tool_${i}`,
            description: `${category} tool ${i}`,
            category,
            inputSchema: { type: 'object', properties: {} },
            handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result' }] }),
          });
        }
      }

      registry.registerMany(tools);

      expect(registry.count()).toBe(25);
      expect(registry.getCategories()).toHaveLength(5);

      for (const category of categories) {
        expect(registry.countByCategory(category)).toBe(5);
      }
    });
  });
});
