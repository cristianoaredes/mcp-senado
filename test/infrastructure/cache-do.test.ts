import { describe, it, expect, beforeEach } from 'vitest';
import { CacheDurableObject } from '../../lib/durable-objects/cache-do.js';

/**
 * Mock DurableObjectState for testing
 */
class MockDurableObjectState implements DurableObjectState {
  private storage: Map<string, unknown> = new Map();
  id: DurableObjectId = {
    toString: () => 'test-cache-id',
    equals: () => false,
    name: 'test-cache',
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

describe('CacheDurableObject', () => {
  let cacheDO: CacheDurableObject;
  let state: MockDurableObjectState;

  beforeEach(async () => {
    state = new MockDurableObjectState();
    cacheDO = new CacheDurableObject(state, {});
  });

  describe('GET /get', () => {
    it('should return not found for non-existent key', async () => {
      const request = new Request('http://do/get?key=missing', {
        method: 'GET',
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ found: false });
    });

    it('should return value for existing key', async () => {
      // Set value first
      const setRequest = new Request('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'test-key',
          value: 'test-value',
          ttl: 60000,
        }),
      });
      await cacheDO.fetch(setRequest);

      // Get value
      const getRequest = new Request('http://do/get?key=test-key', {
        method: 'GET',
      });

      const response = await cacheDO.fetch(getRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ found: true, value: 'test-value' });
    });

    it('should return not found for expired key', async () => {
      // Set value with very short TTL
      const setRequest = new Request('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'expire-key',
          value: 'expire-value',
          ttl: -1, // Already expired
        }),
      });
      await cacheDO.fetch(setRequest);

      // Try to get expired value
      const getRequest = new Request('http://do/get?key=expire-key', {
        method: 'GET',
      });

      const response = await cacheDO.fetch(getRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ found: false });
    });

    it('should return error for missing key parameter', async () => {
      const request = new Request('http://do/get', {
        method: 'GET',
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /set', () => {
    it('should set value successfully', async () => {
      const request = new Request('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'my-key',
          value: { data: 'complex object' },
          ttl: 60000,
        }),
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should return error for missing key', async () => {
      const request = new Request('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: 'value',
        }),
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return error for missing value', async () => {
      const request = new Request('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'key',
        }),
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE /delete', () => {
    it('should delete existing key', async () => {
      // Set value first
      const setRequest = new Request('http://do/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'delete-me',
          value: 'value',
        }),
      });
      await cacheDO.fetch(setRequest);

      // Delete it
      const deleteRequest = new Request('http://do/delete?key=delete-me', {
        method: 'DELETE',
      });

      const response = await cacheDO.fetch(deleteRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true, deleted: true });

      // Verify it's gone
      const getRequest = new Request('http://do/get?key=delete-me', {
        method: 'GET',
      });
      const getResponse = await cacheDO.fetch(getRequest);
      const getData = await getResponse.json();
      expect(getData).toEqual({ found: false });
    });

    it('should return success for non-existent key', async () => {
      const request = new Request('http://do/delete?key=non-existent', {
        method: 'DELETE',
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true, deleted: false });
    });
  });

  describe('POST /clear', () => {
    it('should clear all entries', async () => {
      // Set multiple values
      for (let i = 0; i < 5; i++) {
        const setRequest = new Request('http://do/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `key-${i}`,
            value: `value-${i}`,
          }),
        });
        await cacheDO.fetch(setRequest);
      }

      // Clear all
      const clearRequest = new Request('http://do/clear', {
        method: 'POST',
      });

      const response = await cacheDO.fetch(clearRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('cleared', 5);

      // Verify all gone
      const getRequest = new Request('http://do/get?key=key-0', {
        method: 'GET',
      });
      const getResponse = await cacheDO.fetch(getRequest);
      const getData = await getResponse.json();
      expect(getData).toEqual({ found: false });
    });
  });

  describe('GET /stats', () => {
    it('should return statistics', async () => {
      const request = new Request('http://do/stats', {
        method: 'GET',
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hits');
      expect(data).toHaveProperty('misses');
      expect(data).toHaveProperty('size');
      expect(data).toHaveProperty('hitRate');
      expect(data).toHaveProperty('maxSize');
    });

    it('should track hits and misses', async () => {
      // Set a value
      await cacheDO.fetch(
        new Request('http://do/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'test', value: 'value' }),
        })
      );

      // Hit
      await cacheDO.fetch(new Request('http://do/get?key=test'));

      // Miss
      await cacheDO.fetch(new Request('http://do/get?key=missing'));

      // Get stats
      const statsRequest = new Request('http://do/stats', { method: 'GET' });
      const response = await cacheDO.fetch(statsRequest);
      const stats = await response.json();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown paths', async () => {
      const request = new Request('http://do/unknown', {
        method: 'GET',
      });

      const response = await cacheDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });
});
