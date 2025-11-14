/**
 * Cache Durable Object
 *
 * Provides persistent LRU cache across all Cloudflare Workers instances.
 * Shared globally for all requests.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheDurableObject {
  private state: DurableObjectState;
  private cache: Map<string, CacheEntry<unknown>>;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };
  private maxSize: number;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
    this.maxSize = 1000;

    // Initialize from storage
    const self = this;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await self.state.storage.get<{
        cache: [string, CacheEntry<unknown>][];
        stats: typeof self.stats;
      }>("state");

      if (stored) {
        this.cache = new Map(stored.cache);
        this.stats = stored.stats;
      }
    });
  }

  /**
   * Handle fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === 'GET' && path === '/get') {
        return this.handleGet(request);
      }

      if (request.method === 'POST' && path === '/set') {
        return this.handleSet(request);
      }

      if (request.method === 'DELETE' && path === '/delete') {
        return this.handleDelete(request);
      }

      if (request.method === 'POST' && path === '/clear') {
        return this.handleClear();
      }

      if (request.method === 'GET' && path === '/stats') {
        return this.handleStats();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: (error as Error).message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Get value from cache
   */
  private async handleGet(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      await this.persist();
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    this.stats.hits++;
    return new Response(
      JSON.stringify({ found: true, value: entry.value }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Set value in cache
   */
  private async handleSet(request: Request): Promise<Response> {
    const body = await request.json() as { key: string; value: unknown; ttl?: number };

    if (!body.key || body.value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing key or value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ttl = body.ttl || 300000; // Default 5 minutes
    const expiresAt = Date.now() + ttl;

    // LRU eviction if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(body.key)) {
      // Remove oldest entry (first key in map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(body.key, { value: body.value, expiresAt });
    this.stats.sets++;
    await this.persist();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Delete value from cache
   */
  private async handleDelete(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      await this.persist();
    }

    return new Response(
      JSON.stringify({ success: true, deleted }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Clear all cache
   */
  private async handleClear(): Promise<Response> {
    const size = this.cache.size;
    this.cache.clear();
    await this.persist();

    return new Response(
      JSON.stringify({ success: true, cleared: size }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get cache statistics
   */
  private handleStats(): Response {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return new Response(
      JSON.stringify({
        ...this.stats,
        size: this.cache.size,
        maxSize: this.maxSize,
        hitRate,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Persist cache state to durable storage
   */
  private async persist(): Promise<void> {
    await this.state.storage.put("state", {
      cache: Array.from(this.cache.entries()),
      stats: this.stats,
    });
  }

  /**
   * Clean up expired entries
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.persist();
    }
  }

  /**
   * Cleanup on object destruction
   */
  async alarm(): Promise<void> {
    await this.cleanup();
  }
}
