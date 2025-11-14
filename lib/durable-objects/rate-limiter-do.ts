/**
 * Rate Limiter Durable Object
 *
 * Provides distributed rate limiting using token bucket algorithm.
 * Shared across all Cloudflare Workers instances.
 */

export interface TokenBucket {
  tokens: number;
  lastRefillTime: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

export class RateLimiterDurableObject {
  private state: DurableObjectState;
  private buckets: Map<string, TokenBucket>;
  private stats: {
    allowed: number;
    denied: number;
  };

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.buckets = new Map();
    this.stats = {
      allowed: 0,
      denied: 0,
    };

    // Initialize from storage
    const self = this;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await self.state.storage.get<{
        buckets: [string, TokenBucket][];
        stats: typeof self.stats;
      }>("state");

      if (stored) {
        this.buckets = new Map(stored.buckets);
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
      if (request.method === 'POST' && path === '/check') {
        return this.handleCheckLimit(request);
      }

      if (request.method === 'POST' && path === '/reset') {
        return this.handleReset(request);
      }

      if (request.method === 'GET' && path === '/stats') {
        return this.handleStats(request);
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
   * Check if request should be allowed (consumes token if available)
   */
  private async handleCheckLimit(request: Request): Promise<Response> {
    const body = await request.json() as {
      key: string;
      maxTokens?: number;
      refillRate?: number;
    };

    if (!body.key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const maxTokens = body.maxTokens || 30;
    const refillRate = body.refillRate || 0.5; // tokens per second

    // Get or create bucket
    let bucket = this.buckets.get(body.key);
    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefillTime: Date.now(),
        maxTokens,
        refillRate,
      };
      this.buckets.set(body.key, bucket);
    }

    // Refill tokens based on time elapsed
    const now = Date.now();
    const timeElapsed = (now - bucket.lastRefillTime) / 1000; // seconds
    const tokensToAdd = timeElapsed * bucket.refillRate;
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefillTime = now;

    // Check if token available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.stats.allowed++;
      await this.persist();

      return new Response(
        JSON.stringify({
          allowed: true,
          remainingTokens: Math.floor(bucket.tokens),
          maxTokens: bucket.maxTokens,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      this.stats.denied++;

      // Calculate retry after
      const tokensNeeded = 1 - bucket.tokens;
      const retryAfterSeconds = Math.ceil(tokensNeeded / bucket.refillRate);

      return new Response(
        JSON.stringify({
          allowed: false,
          remainingTokens: 0,
          retryAfter: retryAfterSeconds,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Reset rate limit for a key
   */
  private async handleReset(request: Request): Promise<Response> {
    const body = await request.json() as { key: string };

    if (!body.key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const deleted = this.buckets.delete(body.key);
    if (deleted) {
      await this.persist();
    }

    return new Response(
      JSON.stringify({ success: true, reset: deleted }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get rate limiter statistics
   */
  private handleStats(request: Request): Response {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key) {
      const bucket = this.buckets.get(key);
      if (!bucket) {
        return new Response(
          JSON.stringify({ error: 'Key not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Refill to get current token count
      const now = Date.now();
      const timeElapsed = (now - bucket.lastRefillTime) / 1000;
      const tokensToAdd = timeElapsed * bucket.refillRate;
      const currentTokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);

      return new Response(
        JSON.stringify({
          key,
          tokens: Math.floor(currentTokens),
          maxTokens: bucket.maxTokens,
          refillRate: bucket.refillRate,
          lastRefillTime: bucket.lastRefillTime,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Global stats
    const totalRequests = this.stats.allowed + this.stats.denied;
    const allowRate = totalRequests > 0 ? this.stats.allowed / totalRequests : 0;

    return new Response(
      JSON.stringify({
        ...this.stats,
        totalRequests,
        allowRate,
        activeBuckets: this.buckets.size,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Persist state to durable storage
   */
  private async persist(): Promise<void> {
    await this.state.storage.put("state", {
      buckets: Array.from(this.buckets.entries()),
      stats: this.stats,
    });
  }

  /**
   * Cleanup old buckets periodically
   */
  async alarm(): Promise<void> {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    let cleaned = 0;

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefillTime > maxAge) {
        this.buckets.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.persist();
    }

    // Schedule next cleanup
    await this.state.storage.setAlarm(Date.now() + 3600000);
  }
}
