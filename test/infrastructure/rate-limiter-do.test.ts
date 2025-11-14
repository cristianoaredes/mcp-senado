import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiterDurableObject } from '../../lib/durable-objects/rate-limiter-do.js';

/**
 * Mock DurableObjectState for testing
 */
class MockDurableObjectState implements DurableObjectState {
  private storage: Map<string, unknown> = new Map();
  id: DurableObjectId = {
    toString: () => 'test-rate-limiter-id',
    equals: () => false,
    name: 'test-rate-limiter',
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

describe('RateLimiterDurableObject', () => {
  let rateLimiterDO: RateLimiterDurableObject;
  let state: MockDurableObjectState;

  beforeEach(async () => {
    state = new MockDurableObjectState();
    rateLimiterDO = new RateLimiterDurableObject(state, {});
  });

  describe('POST /check', () => {
    it('should allow request when tokens are available', async () => {
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'user-123',
          maxTokens: 10,
          refillRate: 1, // 1 token per second
        }),
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('allowed', true);
      expect(data).toHaveProperty('remainingTokens');
      expect(data.remainingTokens).toBe(9); // Started with 10, consumed 1
    });

    it('should deny request when no tokens available', async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await rateLimiterDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'user-456',
              maxTokens: 10,
              refillRate: 0.1, // Very slow refill
            }),
          })
        );
      }

      // This request should be denied
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'user-456',
          maxTokens: 10,
          refillRate: 0.1,
        }),
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data).toHaveProperty('allowed', false);
      expect(data).toHaveProperty('retryAfter');
      expect(data.retryAfter).toBeGreaterThan(0);
    });

    it('should refill tokens over time', async () => {
      vi.useFakeTimers();

      // Use up some tokens
      await rateLimiterDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'user-789',
            maxTokens: 5,
            refillRate: 2, // 2 tokens per second
          }),
        })
      );

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Should have refilled 2 tokens (had 4, now should have 5 - capped at max)
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'user-789',
          maxTokens: 5,
          refillRate: 2,
        }),
      });

      const response = await rateLimiterDO.fetch(request);
      const data = await response.json();

      expect(data.allowed).toBe(true);
      expect(data.remainingTokens).toBe(4); // 5 refilled, minus 1 consumed

      vi.useRealTimers();
    });

    it('should return error for missing key parameter', async () => {
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxTokens: 10,
        }),
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should use default values when not specified', async () => {
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'defaults-user',
        }),
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.allowed).toBe(true);
      expect(data.maxTokens).toBe(30); // Default maxTokens
    });
  });

  describe('POST /reset', () => {
    it('should reset rate limit for key', async () => {
      // Create a bucket
      await rateLimiterDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'reset-user',
            maxTokens: 5,
          }),
        })
      );

      // Reset it
      const resetRequest = new Request('http://do/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'reset-user',
        }),
      });

      const response = await rateLimiterDO.fetch(resetRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true, reset: true });
    });

    it('should return success for non-existent key', async () => {
      const request = new Request('http://do/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'non-existent',
        }),
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true, reset: false });
    });

    it('should return error for missing key', async () => {
      const request = new Request('http://do/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /stats', () => {
    it('should return global statistics', async () => {
      const request = new Request('http://do/stats', {
        method: 'GET',
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('allowed');
      expect(data).toHaveProperty('denied');
      expect(data).toHaveProperty('totalRequests');
      expect(data).toHaveProperty('allowRate');
      expect(data).toHaveProperty('activeBuckets');
    });

    it('should return stats for specific key', async () => {
      // Create a bucket
      await rateLimiterDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'stats-user',
            maxTokens: 20,
            refillRate: 1.5,
          }),
        })
      );

      // Get stats for this key
      const request = new Request('http://do/stats?key=stats-user', {
        method: 'GET',
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('key', 'stats-user');
      expect(data).toHaveProperty('tokens');
      expect(data).toHaveProperty('maxTokens', 20);
      expect(data).toHaveProperty('refillRate', 1.5);
    });

    it('should return 404 for non-existent key', async () => {
      const request = new Request('http://do/stats?key=missing', {
        method: 'GET',
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown paths', async () => {
      const request = new Request('http://do/unknown', {
        method: 'GET',
      });

      const response = await rateLimiterDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });
});
