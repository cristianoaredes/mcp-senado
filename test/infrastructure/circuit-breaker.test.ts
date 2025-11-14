import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CircuitBreakerImpl,
  NoOpCircuitBreaker,
  CircuitBreakerError,
  createCircuitBreaker,
} from '../../lib/infrastructure/circuit-breaker.js';
import { CircuitState } from '../../lib/types/index.js';
import type { Logger } from '../../lib/types/index.js';

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
});

describe('CircuitBreakerImpl', () => {
  let breaker: CircuitBreakerImpl;
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
    breaker = new CircuitBreakerImpl(
      {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000, // 1 second
      },
      logger
    );
  });

  describe('CLOSED state (normal operation)', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute successful function', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(fn).toHaveBeenCalledOnce();
      expect(result).toBe('success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should propagate errors from function', async () => {
      const error = new Error('test error');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(breaker.execute(fn)).rejects.toThrow('test error');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should track successful executions', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await breaker.execute(fn);
      await breaker.execute(fn);

      const stats = breaker.getStats();
      expect(stats.successes).toBe(2);
      expect(stats.failures).toBe(0);
    });

    it('should reset failures counter on success after failures', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      const successFn = vi.fn().mockResolvedValue('success');

      // Fail twice
      await expect(breaker.execute(failFn)).rejects.toThrow();
      await expect(breaker.execute(failFn)).rejects.toThrow();

      let stats = breaker.getStats();
      expect(stats.failures).toBe(2);

      // Succeed once - should reset failures
      await breaker.execute(successFn);

      stats = breaker.getStats();
      expect(stats.failures).toBe(0);
    });
  });

  describe('Opening circuit', () => {
    it('should open circuit after reaching failure threshold', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Fail 3 times (threshold)
      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should track last failure time', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const before = Date.now();

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      const after = Date.now();
      const stats = breaker.getStats();

      expect(stats.lastFailureTime).toBeDefined();
      expect(stats.lastFailureTime!).toBeGreaterThanOrEqual(before);
      expect(stats.lastFailureTime!).toBeLessThanOrEqual(after);
    });
  });

  describe('OPEN state (fail fast)', () => {
    beforeEach(async () => {
      // Open the circuit
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should fail fast without executing function', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await expect(breaker.execute(fn)).rejects.toThrow(CircuitBreakerError);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should throw CircuitBreakerError', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await expect(breaker.execute(fn)).rejects.toMatchObject({
        name: 'CircuitBreakerError',
        message: 'Circuit breaker is OPEN',
      });
    });

    it('should include last failure time in error', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      try {
        await breaker.execute(fn);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerError);
        const cbError = error as CircuitBreakerError;
        expect(cbError.lastFailureTime).toBeDefined();
      }
    });
  });

  describe('Transition to HALF_OPEN', () => {
    beforeEach(async () => {
      // Open the circuit
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next execution should transition to HALF_OPEN
      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should not transition before timeout', async () => {
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait less than timeout
      await new Promise(resolve => setTimeout(resolve, 500));

      const fn = vi.fn().mockResolvedValue('success');
      await expect(breaker.execute(fn)).rejects.toThrow(CircuitBreakerError);
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      // Open the circuit
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      // Wait for timeout and transition to HALF_OPEN
      await new Promise(resolve => setTimeout(resolve, 1100));
      const successFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after reaching success threshold', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      // First success already executed in beforeEach
      // Need one more success to reach threshold of 2
      await breaker.execute(fn);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on any failure', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      await expect(breaker.execute(failFn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset success counter when reopening', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // First success already executed in beforeEach (breaker is in HALF_OPEN with 1 success)
      // Fail - should reopen immediately
      await expect(breaker.execute(failFn)).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      const stats = breaker.getStats();
      expect(stats.successes).toBe(0);
    });
  });

  describe('reset()', () => {
    it('should reset to CLOSED state', async () => {
      // Open the circuit
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset all counters', async () => {
      // Open the circuit
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      let stats = breaker.getStats();
      expect(stats.failures).toBeGreaterThan(0);
      expect(stats.lastFailureTime).toBeDefined();

      // Reset
      breaker.reset();

      stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.lastFailureTime).toBeUndefined();
    });

    it('should allow execution after reset', async () => {
      // Open the circuit
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      // Reset
      breaker.reset();

      // Should execute successfully
      const successFn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(successFn);
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
    });
  });

  describe('getStats()', () => {
    it('should return current statistics', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      const stats = breaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.successes).toBe(2);
      expect(stats.failures).toBe(0);
      expect(stats.lastFailureTime).toBeUndefined();
    });

    it('should include failure information', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(breaker.execute(failFn)).rejects.toThrow();

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.lastFailureTime).toBeDefined();
    });
  });

  describe('complex scenarios', () => {
    it('should handle alternating success and failure', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      await breaker.execute(successFn); // Success
      await expect(breaker.execute(failFn)).rejects.toThrow(); // Fail
      await breaker.execute(successFn); // Success (resets failures)
      await expect(breaker.execute(failFn)).rejects.toThrow(); // Fail

      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1); // Reset after each success
    });

    it('should handle complete cycle: CLOSED -> OPEN -> HALF_OPEN -> CLOSED', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      const successFn = vi.fn().mockResolvedValue('success');

      // CLOSED: Normal operation
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow('fail');
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Execute success to transition to HALF_OPEN
      await breaker.execute(successFn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Execute more successes to close circuit
      await breaker.execute(successFn);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

describe('NoOpCircuitBreaker', () => {
  let breaker: NoOpCircuitBreaker;

  beforeEach(() => {
    breaker = new NoOpCircuitBreaker();
  });

  it('should always execute function', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);

    expect(fn).toHaveBeenCalledOnce();
    expect(result).toBe('success');
  });

  it('should propagate errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('test error'));
    await expect(breaker.execute(fn)).rejects.toThrow('test error');
  });

  it('should always return CLOSED state', () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should return zero stats', () => {
    const stats = breaker.getStats();
    expect(stats.state).toBe(CircuitState.CLOSED);
    expect(stats.failures).toBe(0);
    expect(stats.successes).toBe(0);
    expect(stats.lastFailureTime).toBeUndefined();
  });
});

describe('CircuitBreakerError', () => {
  it('should be instance of Error', () => {
    const error = new CircuitBreakerError('test');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name', () => {
    const error = new CircuitBreakerError('test');
    expect(error.name).toBe('CircuitBreakerError');
  });

  it('should store last failure time', () => {
    const time = Date.now();
    const error = new CircuitBreakerError('test', time);
    expect(error.lastFailureTime).toBe(time);
  });

  it('should have stack trace', () => {
    const error = new CircuitBreakerError('test');
    expect(error.stack).toBeDefined();
  });
});

describe('createCircuitBreaker()', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
  });

  it('should create CircuitBreakerImpl when enabled', () => {
    const breaker = createCircuitBreaker(
      { failureThreshold: 3, successThreshold: 2, timeout: 1000 },
      logger,
      true
    );
    expect(breaker).toBeInstanceOf(CircuitBreakerImpl);
  });

  it('should create NoOpCircuitBreaker when disabled', () => {
    const breaker = createCircuitBreaker(
      { failureThreshold: 3, successThreshold: 2, timeout: 1000 },
      logger,
      false
    );
    expect(breaker).toBeInstanceOf(NoOpCircuitBreaker);
  });

  it('should create CircuitBreakerImpl by default', () => {
    const breaker = createCircuitBreaker(
      { failureThreshold: 3, successThreshold: 2, timeout: 1000 },
      logger
    );
    expect(breaker).toBeInstanceOf(CircuitBreakerImpl);
  });
});
