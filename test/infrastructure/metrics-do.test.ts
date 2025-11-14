import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsDurableObject } from '../../lib/durable-objects/metrics-do.js';

/**
 * Mock DurableObjectState for testing
 */
class MockDurableObjectState implements DurableObjectState {
  private storage: Map<string, unknown> = new Map();
  id: DurableObjectId = {
    toString: () => 'test-metrics-id',
    equals: () => false,
    name: 'test-metrics',
  } as DurableObjectId;

  waitUntil(promise: Promise<unknown>): void {
    // No-op for testing
  }

  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T> {
    return callback();
  }

  storage = {
    get: async <T>(key: string): Promise<T | undefined> => {
      return this.storage.get(key) as T | undefined;
    },
    put: async (key: string, value: unknown): Promise<void> => {
      this.storage.set(key, value);
    },
    delete: async (key: string): Promise<boolean> => {
      return this.storage.delete(key);
    },
    list: async () => {
      return new Map(this.storage);
    },
    deleteAll: async (): Promise<void> => {
      this.storage.clear();
    },
    transaction: async <T>(callback: () => Promise<T>): Promise<T> => {
      return callback();
    },
    getAlarm: async () => null,
    setAlarm: async () => {},
    deleteAlarm: async () => {},
    sync: async () => {},
  } as DurableObjectStorage;

  abort(): void {
    throw new Error('Transaction aborted');
  }
}

describe('MetricsDurableObject', () => {
  let metricsDO: MetricsDurableObject;
  let state: MockDurableObjectState;

  beforeEach(async () => {
    state = new MockDurableObjectState();
    metricsDO = new MetricsDurableObject(state, {});
  });

  describe('POST /record', () => {
    it('should record successful tool invocation', async () => {
      const request = new Request('http://do/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get_senator',
          category: 'senators',
          success: true,
          duration: 150,
        }),
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should record failed tool invocation', async () => {
      const request = new Request('http://do/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get_proposal',
          category: 'proposals',
          success: false,
          duration: 50,
        }),
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should update global metrics', async () => {
      // Record multiple invocations
      for (let i = 0; i < 5; i++) {
        await metricsDO.fetch(
          new Request('http://do/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'test_tool',
              category: 'test',
              success: i % 2 === 0,
              duration: 100,
            }),
          })
        );
      }

      // Get global stats
      const statsResponse = await metricsDO.fetch(
        new Request('http://do/global', { method: 'GET' })
      );
      const stats = await statsResponse.json();

      expect(stats.totalInvocations).toBe(5);
      expect(stats.totalSuccesses).toBe(3); // 0, 2, 4
      expect(stats.totalFailures).toBe(2); // 1, 3
      expect(stats.totalDuration).toBe(500);
      expect(stats.averageDuration).toBe(100);
    });

    it('should return error for missing parameters', async () => {
      const request = new Request('http://do/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'test',
          // Missing category, success, duration
        }),
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /tool/:name', () => {
    it('should return metrics for specific tool', async () => {
      const toolName = 'search_senators';

      // Record some metrics
      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: toolName,
            category: 'senators',
            success: true,
            duration: 200,
          }),
        })
      );

      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: toolName,
            category: 'senators',
            success: false,
            duration: 50,
          }),
        })
      );

      // Get tool stats
      const request = new Request(`http://do/tool/${toolName}`, {
        method: 'GET',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('tool', toolName);
      expect(data).toHaveProperty('invocations', 2);
      expect(data).toHaveProperty('successes', 1);
      expect(data).toHaveProperty('failures', 1);
      expect(data).toHaveProperty('totalDuration', 250);
      expect(data).toHaveProperty('averageDuration', 125);
      expect(data).toHaveProperty('successRate', 0.5);
    });

    it('should return 404 for non-existent tool', async () => {
      const request = new Request('http://do/tool/non_existent', {
        method: 'GET',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /category/:name', () => {
    it('should return metrics for specific category', async () => {
      const category = 'proposals';

      // Record metrics for this category
      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'get_proposal',
            category,
            success: true,
            duration: 100,
          }),
        })
      );

      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'search_proposals',
            category,
            success: true,
            duration: 200,
          }),
        })
      );

      // Get category stats
      const request = new Request(`http://do/category/${category}`, {
        method: 'GET',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('category', category);
      expect(data).toHaveProperty('invocations', 2);
    });

    it('should return 404 for non-existent category', async () => {
      const request = new Request('http://do/category/non_existent', {
        method: 'GET',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /global', () => {
    it('should return global metrics', async () => {
      const request = new Request('http://do/global', {
        method: 'GET',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalInvocations');
      expect(data).toHaveProperty('totalSuccesses');
      expect(data).toHaveProperty('totalFailures');
      expect(data).toHaveProperty('totalDuration');
      expect(data).toHaveProperty('averageDuration');
      expect(data).toHaveProperty('successRate');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('startTime');
    });

    it('should calculate correct success rate', async () => {
      // Record 7 successes and 3 failures
      for (let i = 0; i < 10; i++) {
        await metricsDO.fetch(
          new Request('http://do/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'test_tool',
              category: 'test',
              success: i < 7,
              duration: 100,
            }),
          })
        );
      }

      const request = new Request('http://do/global', { method: 'GET' });
      const response = await metricsDO.fetch(request);
      const data = await response.json();

      expect(data.totalInvocations).toBe(10);
      expect(data.totalSuccesses).toBe(7);
      expect(data.totalFailures).toBe(3);
      expect(data.successRate).toBe(0.7);
    });
  });

  describe('GET /tools', () => {
    it('should list all tool metrics', async () => {
      // Record metrics for multiple tools
      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'tool1',
            category: 'cat1',
            success: true,
            duration: 100,
          }),
        })
      );

      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'tool2',
            category: 'cat2',
            success: true,
            duration: 200,
          }),
        })
      );

      const request = new Request('http://do/tools', { method: 'GET' });
      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('tools');
      expect(Array.isArray(data.tools)).toBe(true);
      expect(data.tools.length).toBe(2);
    });
  });

  describe('GET /categories', () => {
    it('should list all category metrics', async () => {
      // Record metrics for multiple categories
      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'tool1',
            category: 'senators',
            success: true,
            duration: 100,
          }),
        })
      );

      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'tool2',
            category: 'proposals',
            success: true,
            duration: 200,
          }),
        })
      );

      const request = new Request('http://do/categories', { method: 'GET' });
      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.length).toBe(2);
    });
  });

  describe('GET /hourly', () => {
    it('should return hourly invocation stats', async () => {
      // Record some metrics
      await metricsDO.fetch(
        new Request('http://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'test',
            category: 'test',
            success: true,
            duration: 100,
          }),
        })
      );

      const request = new Request('http://do/hourly', { method: 'GET' });
      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hourly');
      expect(Array.isArray(data.hourly)).toBe(true);
    });
  });

  describe('POST /reset', () => {
    it('should reset all metrics', async () => {
      // Record some metrics
      for (let i = 0; i < 5; i++) {
        await metricsDO.fetch(
          new Request('http://do/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'test',
              category: 'test',
              success: true,
              duration: 100,
            }),
          })
        );
      }

      // Reset
      const resetRequest = new Request('http://do/reset', {
        method: 'POST',
      });
      const resetResponse = await metricsDO.fetch(resetRequest);
      expect(resetResponse.status).toBe(200);

      // Verify metrics are reset
      const globalRequest = new Request('http://do/global', { method: 'GET' });
      const globalResponse = await metricsDO.fetch(globalRequest);
      const data = await globalResponse.json();

      expect(data.totalInvocations).toBe(0);
      expect(data.totalSuccesses).toBe(0);
      expect(data.totalFailures).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown paths', async () => {
      const request = new Request('http://do/unknown', {
        method: 'GET',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(404);
    });

    it('should handle errors gracefully', async () => {
      const request = new Request('http://do/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await metricsDO.fetch(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});
