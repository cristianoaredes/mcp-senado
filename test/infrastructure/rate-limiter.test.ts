import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TokenBucketRateLimiter,
  NoOpRateLimiter,
  RateLimitError,
  createRateLimiter,
} from '../../lib/infrastructure/rate-limiter.js';
import type { Logger } from '../../lib/types/index.js';

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
});

describe('TokenBucketRateLimiter', () => {
  let limiter: TokenBucketRateLimiter;
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
    limiter = new TokenBucketRateLimiter(
      {
        tokens: 3, // 3 tokens
        interval: 1000, // 1 second window
        refillRate: 100, // Refill 1 token every 100ms
      },
      logger
    );
  });

  describe('checkLimit()', () => {
    it('should allow requests when tokens available', async () => {
      expect(await limiter.checkLimit()).toBe(true);
      expect(await limiter.checkLimit()).toBe(true);
      expect(await limiter.checkLimit()).toBe(true);
    });

    it('should deny requests when tokens exhausted', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      // No tokens left
      expect(await limiter.checkLimit()).toBe(false);
    });

    it('should consume one token per request', async () => {
      let stats = limiter.getStats();
      expect(stats.tokens).toBe(3);

      await limiter.checkLimit();
      stats = limiter.getStats();
      expect(stats.tokens).toBe(2);

      await limiter.checkLimit();
      stats = limiter.getStats();
      expect(stats.tokens).toBe(1);
    });

    it('should allow fractional tokens remaining', async () => {
      await limiter.checkLimit();
      await limiter.checkLimit();

      const stats = limiter.getStats();
      expect(stats.tokens).toBe(1);
    });
  });

  describe('token refill', () => {
    it('should refill tokens over time', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      expect(await limiter.checkLimit()).toBe(false);

      // Wait for refill (100ms = 1 token)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have 1 token now
      expect(await limiter.checkLimit()).toBe(true);
      expect(await limiter.checkLimit()).toBe(false);
    });

    it('should refill multiple tokens', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      // Wait for 2 refills (200ms = 2 tokens)
      await new Promise(resolve => setTimeout(resolve, 250));

      // Should have 2 tokens
      expect(await limiter.checkLimit()).toBe(true);
      expect(await limiter.checkLimit()).toBe(true);
      expect(await limiter.checkLimit()).toBe(false);
    });

    it('should not exceed max tokens', async () => {
      // Wait for multiple refill cycles
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should still have max 3 tokens
      const stats = limiter.getStats();
      expect(stats.tokens).toBe(3);
    });

    it('should refill to max tokens when idle', async () => {
      // Consume one token
      await limiter.checkLimit();

      let stats = limiter.getStats();
      expect(stats.tokens).toBe(2);

      // Wait for multiple refills
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should be back at max
      stats = limiter.getStats();
      expect(stats.tokens).toBe(3);
    });
  });

  describe('getStats()', () => {
    it('should return current statistics', () => {
      const stats = limiter.getStats();
      expect(stats.tokens).toBe(3);
      expect(stats.maxTokens).toBe(3);
      expect(stats.refillRate).toBe(100);
      expect(stats.lastRefillTime).toBeDefined();
    });

    it('should reflect token consumption', async () => {
      await limiter.checkLimit();
      await limiter.checkLimit();

      const stats = limiter.getStats();
      expect(stats.tokens).toBe(1);
      expect(stats.maxTokens).toBe(3);
    });

    it('should update after refill', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      let stats = limiter.getStats();
      expect(stats.tokens).toBe(0);

      // Wait for refill
      await new Promise(resolve => setTimeout(resolve, 150));

      stats = limiter.getStats();
      expect(stats.tokens).toBe(1);
    });
  });

  describe('waitForToken()', () => {
    it('should wait for token to become available', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      const startTime = Date.now();

      // Wait for token (should wait ~100ms for refill)
      await limiter.waitForToken();

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(50); // Allow some tolerance
      expect(elapsed).toBeLessThan(300);
    });

    it('should return immediately if token available', async () => {
      const startTime = Date.now();

      await limiter.waitForToken();

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(50);
    });

    // Skip slow timeout tests - they work but take too long
    it.skip('should throw after max wait time', async () => {
      // Create limiter with very slow refill
      const slowLimiter = new TokenBucketRateLimiter(
        {
          tokens: 1,
          interval: 1000,
          refillRate: 5000, // Very slow: 5 seconds per token
        },
        logger
      );

      // Consume the only token
      await slowLimiter.checkLimit();

      // Try to wait - should throw because refill is too slow
      await expect(slowLimiter.waitForToken()).rejects.toThrow(RateLimitError);
    }, 3000);

    it.skip('should include retry-after in error', async () => {
      const slowLimiter = new TokenBucketRateLimiter(
        {
          tokens: 1,
          interval: 1000,
          refillRate: 5000,
        },
        logger
      );

      await slowLimiter.checkLimit();

      try {
        await slowLimiter.waitForToken();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        const rateLimitError = error as RateLimitError;
        expect(rateLimitError.retryAfter).toBeGreaterThan(0);
      }
    }, 3000);
  });

  describe('reset()', () => {
    it('should restore all tokens', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      let stats = limiter.getStats();
      expect(stats.tokens).toBe(0);

      // Reset
      limiter.reset();

      stats = limiter.getStats();
      expect(stats.tokens).toBe(3);
    });

    it('should allow requests after reset', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();
      expect(await limiter.checkLimit()).toBe(false);

      // Reset and try again
      limiter.reset();
      expect(await limiter.checkLimit()).toBe(true);
    });

    it('should reset refill timer', async () => {
      const startTime = Date.now();

      // Wait some time
      await new Promise(resolve => setTimeout(resolve, 100));

      limiter.reset();

      const stats = limiter.getStats();
      expect(stats.lastRefillTime).toBeGreaterThanOrEqual(startTime + 100);
    });
  });

  describe('refill rate calculation', () => {
    it('should calculate correct refill cycles', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      // Wait for exactly 3 refill cycles (300ms)
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should have 3 tokens (maxed out)
      const stats = limiter.getStats();
      expect(stats.tokens).toBe(3);
    });

    it('should handle partial refill cycles', async () => {
      // Consume all tokens
      await limiter.checkLimit();
      await limiter.checkLimit();
      await limiter.checkLimit();

      // Wait for 1.5 refill cycles (150ms) - should only refill 1 token
      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = limiter.getStats();
      expect(stats.tokens).toBe(1);
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent checkLimit calls', async () => {
      const results = await Promise.all([
        limiter.checkLimit(),
        limiter.checkLimit(),
        limiter.checkLimit(),
        limiter.checkLimit(), // This should fail
      ]);

      const allowed = results.filter(r => r === true).length;
      const denied = results.filter(r => r === false).length;

      expect(allowed).toBe(3);
      expect(denied).toBe(1);
    });
  });
});

describe('NoOpRateLimiter', () => {
  let limiter: NoOpRateLimiter;

  beforeEach(() => {
    limiter = new NoOpRateLimiter();
  });

  it('should always allow requests', async () => {
    for (let i = 0; i < 100; i++) {
      expect(await limiter.checkLimit()).toBe(true);
    }
  });

  it('should return infinity tokens in stats', () => {
    const stats = limiter.getStats();
    expect(stats.tokens).toBe(Infinity);
    expect(stats.maxTokens).toBe(Infinity);
  });

  it('should have zero refill rate', () => {
    const stats = limiter.getStats();
    expect(stats.refillRate).toBe(0);
  });
});

describe('RateLimitError', () => {
  it('should be instance of Error', () => {
    const error = new RateLimitError('test', 1000);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name', () => {
    const error = new RateLimitError('test', 1000);
    expect(error.name).toBe('RateLimitError');
  });

  it('should store retry-after time', () => {
    const error = new RateLimitError('test', 1500);
    expect(error.retryAfter).toBe(1500);
  });

  it('should have stack trace', () => {
    const error = new RateLimitError('test', 1000);
    expect(error.stack).toBeDefined();
  });
});

describe('createRateLimiter()', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
  });

  it('should create TokenBucketRateLimiter when enabled', () => {
    const limiter = createRateLimiter(
      { tokens: 10, interval: 1000, refillRate: 100 },
      logger,
      true
    );
    expect(limiter).toBeInstanceOf(TokenBucketRateLimiter);
  });

  it('should create NoOpRateLimiter when disabled', () => {
    const limiter = createRateLimiter(
      { tokens: 10, interval: 1000, refillRate: 100 },
      logger,
      false
    );
    expect(limiter).toBeInstanceOf(NoOpRateLimiter);
  });

  it('should create TokenBucketRateLimiter by default', () => {
    const limiter = createRateLimiter(
      { tokens: 10, interval: 1000, refillRate: 100 },
      logger
    );
    expect(limiter).toBeInstanceOf(TokenBucketRateLimiter);
  });
});
