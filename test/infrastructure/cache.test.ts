import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRUCache, NoOpCache, createCache } from '../../lib/infrastructure/cache.js';
import type { Logger } from '../../lib/types/index.js';

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
});

describe('LRUCache', () => {
  let cache: LRUCache;
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
    cache = new LRUCache(
      {
        ttl: 1000, // 1 second
        maxSize: 3,
        cleanupInterval: 100,
      },
      logger
    );
  });

  afterEach(() => {
    cache.stopCleanup();
  });

  describe('get() and set()', () => {
    it('should return null for non-existent key', async () => {
      const result = await cache.get('missing');
      expect(result).toBeNull();
    });

    it('should store and retrieve value', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should store and retrieve complex objects', async () => {
      const obj = { id: 1, name: 'test', nested: { value: 42 } };
      await cache.set('obj', obj);
      const result = await cache.get('obj');
      expect(result).toEqual(obj);
    });

    it('should return null for expired entries', async () => {
      await cache.set('short-lived', 'value', 50); // 50ms TTL

      // Should exist immediately
      let result = await cache.get('short-lived');
      expect(result).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be expired now
      result = await cache.get('short-lived');
      expect(result).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      await cache.set('default-ttl', 'value');
      const result = await cache.get('default-ttl');
      expect(result).toBe('value');
    });

    it('should use custom TTL when specified', async () => {
      await cache.set('custom-ttl', 'value', 2000); // 2 seconds

      // Should still exist after default TTL would expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      const result = await cache.get('custom-ttl');
      expect(result).toBe('value');
    });

    it('should update existing entries', async () => {
      await cache.set('key', 'value1');
      await cache.set('key', 'value2');
      const result = await cache.get('key');
      expect(result).toBe('value2');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when full', async () => {
      // Fill cache to max size (3)
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Access key1 to make it recently used
      await cache.get('key1');

      // Add new entry - should evict key2 (least recently used)
      await cache.set('key4', 'value4');

      expect(await cache.get('key1')).toBe('value1'); // Still exists
      expect(await cache.get('key2')).toBeNull(); // Evicted
      expect(await cache.get('key3')).toBe('value3'); // Still exists
      expect(await cache.get('key4')).toBe('value4'); // Newly added
    });

    it('should not evict when updating existing entry', async () => {
      // Fill cache
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Update existing entry - should not trigger eviction
      await cache.set('key2', 'updated');

      // All entries should still exist
      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('updated');
      expect(await cache.get('key3')).toBe('value3');
    });

    it('should track access order correctly', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Access in specific order: key3, key1, key2
      await cache.get('key3');
      await cache.get('key1');
      await cache.get('key2');

      // Add new entry - should evict key3 (least recently accessed)
      await cache.set('key4', 'value4');

      expect(await cache.get('key3')).toBeNull(); // Evicted
      expect(await cache.get('key1')).toBe('value1'); // Still exists
      expect(await cache.get('key2')).toBe('value2'); // Still exists
      expect(await cache.get('key4')).toBe('value4'); // Newly added
    });
  });

  describe('delete()', () => {
    it('should delete existing entry', async () => {
      await cache.set('key', 'value');
      expect(await cache.get('key')).toBe('value');

      await cache.delete('key');
      expect(await cache.get('key')).toBeNull();
    });

    it('should not throw when deleting non-existent entry', async () => {
      await expect(cache.delete('missing')).resolves.not.toThrow();
    });

    it('should free up space after deletion', async () => {
      // Fill cache
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Delete one
      await cache.delete('key2');

      // Should be able to add without eviction
      await cache.set('key4', 'value4');

      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBe('value3');
      expect(await cache.get('key4')).toBe('value4');
    });
  });

  describe('clear()', () => {
    it('should remove all entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });

    it('should reset statistics', async () => {
      await cache.set('key', 'value');
      await cache.get('key'); // Hit
      await cache.get('missing'); // Miss

      await cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('generateKey()', () => {
    it('should generate consistent keys for same params', () => {
      const params = { id: 1, name: 'test' };
      const key1 = cache.generateKey('prefix', params);
      const key2 = cache.generateKey('prefix', params);
      expect(key1).toBe(key2);
    });

    it('should generate same key regardless of param order', () => {
      const params1 = { a: 1, b: 2, c: 3 };
      const params2 = { c: 3, a: 1, b: 2 };
      const key1 = cache.generateKey('prefix', params1);
      const key2 = cache.generateKey('prefix', params2);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different prefixes', () => {
      const params = { id: 1 };
      const key1 = cache.generateKey('prefix1', params);
      const key2 = cache.generateKey('prefix2', params);
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const key1 = cache.generateKey('prefix', { id: 1 });
      const key2 = cache.generateKey('prefix', { id: 2 });
      expect(key1).not.toBe(key2);
    });

    it('should handle empty params', () => {
      const key = cache.generateKey('prefix', {});
      expect(key).toBe('prefix:');
    });

    it('should handle complex param values', () => {
      const params = {
        str: 'value',
        num: 42,
        bool: true,
        null: null,
        arr: [1, 2, 3],
        obj: { nested: 'value' },
      };
      const key = cache.generateKey('prefix', params);
      expect(key).toContain('prefix:');
      expect(key).toContain('arr=');
      expect(key).toContain('obj=');
    });
  });

  describe('getStats()', () => {
    it('should track hits and misses', async () => {
      await cache.set('key', 'value');

      await cache.get('key'); // Hit
      await cache.get('key'); // Hit
      await cache.get('missing'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      await cache.set('key', 'value');

      await cache.get('key'); // Hit
      await cache.get('missing'); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.5); // 1 hit / 2 total
    });

    it('should track cache size', async () => {
      let stats = cache.getStats();
      expect(stats.size).toBe(0);

      await cache.set('key1', 'value1');
      stats = cache.getStats();
      expect(stats.size).toBe(1);

      await cache.set('key2', 'value2');
      stats = cache.getStats();
      expect(stats.size).toBe(2);

      await cache.delete('key1');
      stats = cache.getStats();
      expect(stats.size).toBe(1);
    });

    it('should return 0 hit rate when no accesses', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should count expired entries as misses', async () => {
      await cache.set('key', 'value', 50);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      await cache.get('key'); // Miss (expired)

      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
    });
  });

  describe('automatic cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      await cache.set('key1', 'value1', 50);
      await cache.set('key2', 'value2', 1000);

      // Wait for key1 to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 200));

      // key1 should be cleaned up
      expect(await cache.get('key1')).toBeNull();
      // key2 should still exist
      expect(await cache.get('key2')).toBe('value2');
    });

    it('should stop cleanup when requested', async () => {
      cache.stopCleanup();

      await cache.set('key', 'value', 50);

      // Wait longer than expiry and cleanup interval
      await new Promise(resolve => setTimeout(resolve, 200));

      // Entry should be expired but not cleaned up automatically
      // It will still be removed on access
      expect(await cache.get('key')).toBeNull();
    });
  });
});

describe('NoOpCache', () => {
  let cache: NoOpCache;

  beforeEach(() => {
    cache = new NoOpCache();
  });

  it('should always return null for get()', async () => {
    const result = await cache.get('any-key');
    expect(result).toBeNull();
  });

  it('should not throw on set()', async () => {
    await expect(cache.set('key', 'value')).resolves.not.toThrow();
  });

  it('should not throw on delete()', async () => {
    await expect(cache.delete('key')).resolves.not.toThrow();
  });

  it('should not throw on clear()', async () => {
    await expect(cache.clear()).resolves.not.toThrow();
  });

  it('should generate keys like LRUCache', () => {
    const params = { a: 1, b: 2 };
    const key1 = cache.generateKey('prefix', params);
    const key2 = cache.generateKey('prefix', params);
    expect(key1).toBe(key2);
    expect(key1).toContain('prefix:');
  });

  it('should return zero stats', () => {
    const stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.size).toBe(0);
    expect(stats.hitRate).toBe(0);
  });
});

describe('createCache()', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
  });

  it('should create LRUCache when enabled', () => {
    const cache = createCache(
      { ttl: 1000, maxSize: 10, cleanupInterval: 100 },
      logger,
      true
    );
    expect(cache).toBeInstanceOf(LRUCache);
    (cache as LRUCache).stopCleanup();
  });

  it('should create NoOpCache when disabled', () => {
    const cache = createCache(
      { ttl: 1000, maxSize: 10, cleanupInterval: 100 },
      logger,
      false
    );
    expect(cache).toBeInstanceOf(NoOpCache);
  });

  it('should create LRUCache by default', () => {
    const cache = createCache(
      { ttl: 1000, maxSize: 10, cleanupInterval: 100 },
      logger
    );
    expect(cache).toBeInstanceOf(LRUCache);
    (cache as LRUCache).stopCleanup();
  });
});
