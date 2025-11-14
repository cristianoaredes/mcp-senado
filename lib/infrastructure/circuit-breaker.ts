/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures by:
 * - Opening circuit after N consecutive failures
 * - Testing recovery after timeout
 * - Closing circuit after N consecutive successes
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures detected, requests fail fast
 * - HALF_OPEN: Testing recovery, limited requests allowed
 */

import type {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerStats,
  CircuitBreakerConfig,
  Logger,
} from '../types/index.js';
import { CircuitState as State } from '../types/index.js';

export class CircuitBreakerImpl implements CircuitBreaker {
  private state: CircuitState;
  private failures: number;
  private successes: number;
  private lastFailureTime?: number;
  private readonly config: CircuitBreakerConfig;
  private readonly logger: Logger;

  constructor(config: CircuitBreakerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.state = State.CLOSED;
    this.failures = 0;
    this.successes = 0;

    this.logger.debug('Circuit breaker initialized', {
      failureThreshold: config.failureThreshold,
      successThreshold: config.successThreshold,
      timeout: config.timeout,
    });
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition to HALF_OPEN
    if (this.state === State.OPEN && this.shouldAttemptReset()) {
      this.transitionTo(State.HALF_OPEN);
    }

    // Fail fast if circuit is OPEN
    if (this.state === State.OPEN) {
      throw new CircuitBreakerError(
        'Circuit breaker is OPEN',
        this.lastFailureTime
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failures = 0;

    if (this.state === State.HALF_OPEN) {
      this.successes++;

      this.logger.debug('Circuit breaker success in HALF_OPEN', {
        successes: this.successes,
        threshold: this.config.successThreshold,
      });

      // Close circuit if success threshold reached
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(State.CLOSED);
        this.successes = 0;
      }
    } else if (this.state === State.CLOSED) {
      this.successes++;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0;

    this.logger.warn('Circuit breaker failure', {
      state: this.state,
      failures: this.failures,
      threshold: this.config.failureThreshold,
    });

    // Open circuit if failure threshold reached
    if (
      this.state === State.CLOSED &&
      this.failures >= this.config.failureThreshold
    ) {
      this.transitionTo(State.OPEN);
    } else if (this.state === State.HALF_OPEN) {
      // Any failure in HALF_OPEN reopens the circuit
      this.transitionTo(State.OPEN);
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.config.timeout;
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    this.logger.info('Circuit breaker state transition', {
      from: oldState,
      to: newState,
      failures: this.failures,
      successes: this.successes,
    });

    // Reset counters on state transitions
    if (newState === State.CLOSED) {
      this.failures = 0;
      this.successes = 0;
      this.lastFailureTime = undefined;
    } else if (newState === State.HALF_OPEN) {
      this.successes = 0;
    }
  }

  /**
   * Manually reset circuit breaker (for testing/admin)
   */
  reset(): void {
    this.logger.info('Circuit breaker manually reset');
    this.state = State.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * No-op circuit breaker for when feature is disabled
 */
export class NoOpCircuitBreaker implements CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return await fn();
  }

  getState(): CircuitState {
    return State.CLOSED;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: State.CLOSED,
      failures: 0,
      successes: 0,
    };
  }
}

/**
 * Custom error for circuit breaker
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly lastFailureTime?: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory function to create circuit breaker
 */
export function createCircuitBreaker(
  config: CircuitBreakerConfig,
  logger: Logger,
  enabled: boolean = true
): CircuitBreaker {
  if (!enabled) {
    logger.info('Circuit breaker disabled, using no-op implementation');
    return new NoOpCircuitBreaker();
  }

  return new CircuitBreakerImpl(config, logger);
}
