/**
 * LRU Cache with TTL (Time To Live)
 *
 * Features:
 * - Least Recently Used (LRU) eviction policy
 * - Time-based expiration (TTL)
 * - Cache statistics tracking
 * - Automatic cleanup of expired entries
 */

import type {
  CacheInterface,
  CacheStats,
  CacheEntry,
  Logger,
} from '../types/index.js';

export interface CacheConfig {
  ttl: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export class LRUCache implements CacheInterface {
  private readonly config: CacheConfig;
  private readonly logger: Logger;
  private readonly cache: Map<string, CacheEntry<unknown>>;
  private readonly accessOrder: string[]; // Track access order for LRU
  private stats: { hits: number; misses: number };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = { hits: 0, misses: 0 };

    // Start automatic cleanup
    this.startCleanup();

    this.logger.debug('Cache initialized', {
      ttl: config.ttl,
      maxSize: config.maxSize,
      cleanupInterval: config.cleanupInterval,
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // Cache miss - entry doesn't exist
    if (!entry) {
      this.stats.misses++;
      this.logger.debug('Cache miss', { key });
      return null;
    }

    // Cache miss - entry expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.misses++;
      this.logger.debug('Cache miss (expired)', { key });
      return null;
    }

    // Cache hit
    this.stats.hits++;
    this.updateAccessOrder(key);
    this.logger.debug('Cache hit', { key });
    return entry.value;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || this.config.ttl);

    // Check if cache is full
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
    this.updateAccessOrder(key);

    this.logger.debug('Cache set', {
      key,
      ttl: ttl || this.config.ttl,
      expiresAt,
      size: this.cache.size,
    });
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    this.removeFromAccessOrder(key);

    if (deleted) {
      this.logger.debug('Cache delete', { key });
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder.length = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;

    this.logger.info('Cache cleared', { previousSize: size });
  }

  /**
   * Generate cache key from prefix and parameters
   */
  generateKey(prefix: string, params: Record<string, unknown>): string {
    // Sort params by key for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${prefix}:${sortedParams}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug('Cache cleanup completed', {
        removed,
        remaining: this.cache.size,
      });
    }
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    // Prevent timer from keeping process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      this.logger.debug('Cache cleanup stopped');
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    this.cache.delete(lruKey);
    this.removeFromAccessOrder(lruKey);

    this.logger.debug('Cache LRU eviction', {
      key: lruKey,
      size: this.cache.size,
    });
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    this.removeFromAccessOrder(key);

    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

/**
 * No-op cache for when caching is disabled
 */
export class NoOpCache implements CacheInterface {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(
    _key: string,
    _value: T,
    _ttl?: number
  ): Promise<void> {
    // No-op
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    // No-op
  }

  generateKey(prefix: string, params: Record<string, unknown>): string {
    // Still need to generate keys for logging purposes
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${prefix}:${sortedParams}`;
  }

  getStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
    };
  }
}

/**
 * Factory function to create cache
 */
export function createCache(
  config: CacheConfig,
  logger: Logger,
  enabled: boolean = true
): CacheInterface {
  if (!enabled) {
    logger.info('Cache disabled, using no-op cache');
    return new NoOpCache();
  }

  return new LRUCache(config, logger);
}
