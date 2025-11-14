/**
 * Rate Limiter using Token Bucket Algorithm
 *
 * Controls API request rate by:
 * - Maintaining a bucket of tokens
 * - Each request consumes one token
 * - Tokens refill at a constant rate
 * - Requests fail if no tokens available
 */

import type {
  RateLimiter,
  RateLimiterStats,
  RateLimiterConfig,
  Logger,
} from '../types/index.js';

export class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly config: RateLimiterConfig;
  private readonly logger: Logger;

  constructor(config: RateLimiterConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.tokens = config.tokens;
    this.lastRefillTime = Date.now();

    this.logger.debug('Rate limiter initialized', {
      tokens: config.tokens,
      interval: config.interval,
      refillRate: config.refillRate,
    });
  }

  /**
   * Check if request is allowed
   * Returns true if token available, false otherwise
   */
  async checkLimit(): Promise<boolean> {
    // Refill tokens based on time elapsed
    this.refillTokens();

    // Check if tokens available
    if (this.tokens >= 1) {
      this.tokens -= 1;

      this.logger.debug('Rate limit check: allowed', {
        tokensRemaining: this.tokens,
      });

      return true;
    }

    this.logger.warn('Rate limit check: exceeded', {
      tokensRemaining: this.tokens,
      nextRefillIn: this.getNextRefillTime(),
    });

    return false;
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): RateLimiterStats {
    // Refill tokens first to get current state
    this.refillTokens();

    return {
      tokens: this.tokens,
      maxTokens: this.config.tokens,
      refillRate: this.config.refillRate,
      lastRefillTime: this.lastRefillTime,
    };
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;

    // Check if it's time to refill
    if (timeSinceLastRefill < this.config.refillRate) {
      return;
    }

    // Calculate tokens to add
    const refillCycles = Math.floor(
      timeSinceLastRefill / this.config.refillRate
    );

    if (refillCycles > 0) {
      const tokensToAdd = refillCycles;
      const oldTokens = this.tokens;

      // Add tokens, but don't exceed max
      this.tokens = Math.min(
        this.tokens + tokensToAdd,
        this.config.tokens
      );

      this.lastRefillTime = now;

      if (this.tokens > oldTokens) {
        this.logger.debug('Tokens refilled', {
          added: this.tokens - oldTokens,
          current: this.tokens,
          max: this.config.tokens,
        });
      }
    }
  }

  /**
   * Get time until next token refill (in milliseconds)
   */
  private getNextRefillTime(): number {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;
    const timeUntilNextRefill =
      this.config.refillRate - timeSinceLastRefill;

    return Math.max(0, timeUntilNextRefill);
  }

  /**
   * Wait for rate limit to allow request
   */
  async waitForToken(): Promise<void> {
    const maxWaitTime = this.config.interval; // Wait at most one full interval
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      if (await this.checkLimit()) {
        return;
      }

      // Wait for next refill
      const waitTime = this.getNextRefillTime();
      await this.sleep(waitTime);
    }

    throw new RateLimitError(
      'Rate limit exceeded, max wait time reached',
      this.getNextRefillTime()
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Manually reset rate limiter (for testing/admin)
   */
  reset(): void {
    this.tokens = this.config.tokens;
    this.lastRefillTime = Date.now();

    this.logger.info('Rate limiter manually reset', {
      tokens: this.tokens,
    });
  }
}

/**
 * No-op rate limiter for when feature is disabled
 */
export class NoOpRateLimiter implements RateLimiter {
  async checkLimit(): Promise<boolean> {
    return true;
  }

  getStats(): RateLimiterStats {
    return {
      tokens: Infinity,
      maxTokens: Infinity,
      refillRate: 0,
      lastRefillTime: Date.now(),
    };
  }
}

/**
 * Custom error for rate limit exceeded
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory function to create rate limiter
 */
export function createRateLimiter(
  config: RateLimiterConfig,
  logger: Logger,
  enabled: boolean = true
): RateLimiter {
  if (!enabled) {
    logger.info('Rate limiter disabled, using no-op implementation');
    return new NoOpRateLimiter();
  }

  return new TokenBucketRateLimiter(config, logger);
}
