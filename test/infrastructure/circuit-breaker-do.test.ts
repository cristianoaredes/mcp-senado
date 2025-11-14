import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreakerDurableObject } from '../../lib/durable-objects/circuit-breaker-do.js';

/**
 * Mock DurableObjectState for testing
 */
class MockDurableObjectState implements DurableObjectState {
  private storage: Map<string, unknown> = new Map();
  id: DurableObjectId = {
    toString: () => 'test-circuit-breaker-id',
    equals: () => false,
    name: 'test-circuit-breaker',
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

describe('CircuitBreakerDurableObject', () => {
  let circuitBreakerDO: CircuitBreakerDurableObject;
  let state: MockDurableObjectState;

  beforeEach(async () => {
    state = new MockDurableObjectState();
    circuitBreakerDO = new CircuitBreakerDurableObject(state, {});
  });

  describe('POST /check', () => {
    it('should allow request when circuit is CLOSED', async () => {
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'api-1',
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 60000,
        }),
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('allowed', true);
      expect(data).toHaveProperty('state', 'CLOSED');
    });

    it('should deny request when circuit is OPEN', async () => {
      const key = 'api-2';

      // Record failures to open circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              failureThreshold: 5,
            }),
          })
        );

        await circuitBreakerDO.fetch(
          new Request('http://do/recordFailure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
      }

      // Circuit should be OPEN now
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          failureThreshold: 5,
        }),
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data).toHaveProperty('allowed', false);
      expect(data).toHaveProperty('state', 'OPEN');
    });

    it('should transition from OPEN to HALF_OPEN after timeout', async () => {
      vi.useFakeTimers();

      const key = 'api-3';
      const timeout = 60000;

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              failureThreshold: 5,
              timeout,
            }),
          })
        );

        await circuitBreakerDO.fetch(
          new Request('http://do/recordFailure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
      }

      // Advance time past timeout
      vi.advanceTimersByTime(timeout + 1000);

      // Check should now allow request in HALF_OPEN state
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          failureThreshold: 5,
          timeout,
        }),
      });

      const response = await circuitBreakerDO.fetch(request);
      const data = await response.json();

      expect(data.allowed).toBe(true);
      expect(data.state).toBe('HALF_OPEN');

      vi.useRealTimers();
    });

    it('should return error for missing key parameter', async () => {
      const request = new Request('http://do/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /recordSuccess', () => {
    it('should record success and close circuit from HALF_OPEN', async () => {
      const key = 'api-4';

      // First open the circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, failureThreshold: 5 }),
          })
        );
        await circuitBreakerDO.fetch(
          new Request('http://do/recordFailure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
      }

      // Transition to HALF_OPEN (using timeout)
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000);

      await circuitBreakerDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      // Record successes to close circuit
      for (let i = 0; i < 2; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/recordSuccess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
      }

      // Get stats to verify CLOSED state
      const statsResponse = await circuitBreakerDO.fetch(
        new Request(`http://do/stats?key=${key}`, { method: 'GET' })
      );
      const stats = await statsResponse.json();

      expect(stats.state).toBe('CLOSED');

      vi.useRealTimers();
    });

    it('should reset failures when recording success in CLOSED state', async () => {
      const key = 'api-5';

      // Record some failures
      await circuitBreakerDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );
      await circuitBreakerDO.fetch(
        new Request('http://do/recordFailure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      // Record success
      await circuitBreakerDO.fetch(
        new Request('http://do/recordSuccess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      // Get stats
      const statsResponse = await circuitBreakerDO.fetch(
        new Request(`http://do/stats?key=${key}`, { method: 'GET' })
      );
      const stats = await statsResponse.json();

      expect(stats.failures).toBe(0);
      expect(stats.state).toBe('CLOSED');
    });

    it('should return error for missing key', async () => {
      const request = new Request('http://do/recordSuccess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent circuit', async () => {
      const request = new Request('http://do/recordSuccess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'non-existent' }),
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /recordFailure', () => {
    it('should open circuit after reaching failure threshold', async () => {
      const key = 'api-6';

      // Check and record failures
      for (let i = 0; i < 5; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, failureThreshold: 5 }),
          })
        );

        const response = await circuitBreakerDO.fetch(
          new Request('http://do/recordFailure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );

        const data = await response.json();
        expect(response.status).toBe(200);

        if (i === 4) {
          expect(data.state).toBe('OPEN');
        }
      }
    });

    it('should reopen circuit on failure in HALF_OPEN state', async () => {
      vi.useFakeTimers();

      const key = 'api-7';

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
        await circuitBreakerDO.fetch(
          new Request('http://do/recordFailure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
      }

      // Transition to HALF_OPEN
      vi.advanceTimersByTime(61000);
      await circuitBreakerDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      // Record failure in HALF_OPEN
      const response = await circuitBreakerDO.fetch(
        new Request('http://do/recordFailure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      const data = await response.json();
      expect(data.state).toBe('OPEN');

      vi.useRealTimers();
    });

    it('should return 404 for non-existent circuit', async () => {
      const request = new Request('http://do/recordFailure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'non-existent' }),
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      const key = 'api-8';

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await circuitBreakerDO.fetch(
          new Request('http://do/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
        await circuitBreakerDO.fetch(
          new Request('http://do/recordFailure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          })
        );
      }

      // Reset
      const response = await circuitBreakerDO.fetch(
        new Request('http://do/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true, reset: true });

      // Verify it's CLOSED
      const statsResponse = await circuitBreakerDO.fetch(
        new Request(`http://do/stats?key=${key}`, { method: 'GET' })
      );
      const stats = await statsResponse.json();
      expect(stats.state).toBe('CLOSED');
      expect(stats.failures).toBe(0);
    });
  });

  describe('GET /stats', () => {
    it('should return global statistics', async () => {
      const request = new Request('http://do/stats', {
        method: 'GET',
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalRequests');
      expect(data).toHaveProperty('totalFailures');
      expect(data).toHaveProperty('totalSuccesses');
      expect(data).toHaveProperty('circuitOpens');
      expect(data).toHaveProperty('circuitCloses');
      expect(data).toHaveProperty('failureRate');
      expect(data).toHaveProperty('activeCircuits');
    });

    it('should return stats for specific circuit', async () => {
      const key = 'api-9';

      // Create circuit
      await circuitBreakerDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
      );

      // Get stats
      const request = new Request(`http://do/stats?key=${key}`, {
        method: 'GET',
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('key', key);
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('failures');
      expect(data).toHaveProperty('successes');
    });

    it('should return 404 for non-existent circuit', async () => {
      const request = new Request('http://do/stats?key=missing', {
        method: 'GET',
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown paths', async () => {
      const request = new Request('http://do/unknown', {
        method: 'GET',
      });

      const response = await circuitBreakerDO.fetch(request);
      expect(response.status).toBe(404);
    });
  });
});
