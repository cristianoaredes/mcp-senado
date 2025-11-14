/**
 * Circuit Breaker Durable Object
 *
 * Provides distributed circuit breaker pattern for API resilience.
 * Tracks API health globally across all Cloudflare Workers instances.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastStateChange: number;
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export class CircuitBreakerDurableObject {
  private state: DurableObjectState;
  private circuits: Map<string, CircuitBreakerState>;
  private stats: {
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
    circuitOpens: number;
    circuitCloses: number;
  };

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.circuits = new Map();
    this.stats = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      circuitOpens: 0,
      circuitCloses: 0,
    };

    // Initialize from storage
    const self = this;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await self.state.storage.get<{
        circuits: [string, CircuitBreakerState][];
        stats: typeof self.stats;
      }>("state");

      if (stored) {
        this.circuits = new Map(stored.circuits);
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
        return this.handleCheck(request);
      }

      if (request.method === 'POST' && path === '/recordSuccess') {
        return this.handleRecordSuccess(request);
      }

      if (request.method === 'POST' && path === '/recordFailure') {
        return this.handleRecordFailure(request);
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
   * Check if circuit allows request
   */
  private async handleCheck(request: Request): Promise<Response> {
    const body = await request.json() as {
      key: string;
      failureThreshold?: number;
      successThreshold?: number;
      timeout?: number;
    };

    if (!body.key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const failureThreshold = body.failureThreshold || 5;
    const successThreshold = body.successThreshold || 2;
    const timeout = body.timeout || 60000;

    // Get or create circuit
    let circuit = this.circuits.get(body.key);
    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastStateChange: Date.now(),
        failureThreshold,
        successThreshold,
        timeout,
      };
      this.circuits.set(body.key, circuit);
    }

    const now = Date.now();

    // Check if should transition from OPEN to HALF_OPEN
    if (circuit.state === 'OPEN') {
      const timeSinceOpen = now - circuit.lastStateChange;
      if (timeSinceOpen >= circuit.timeout) {
        circuit.state = 'HALF_OPEN';
        circuit.successes = 0;
        circuit.lastStateChange = now;
        await this.persist();
      }
    }

    this.stats.totalRequests++;

    // Return current state
    const allowed = circuit.state !== 'OPEN';

    return new Response(
      JSON.stringify({
        allowed,
        state: circuit.state,
        failures: circuit.failures,
        successes: circuit.successes,
        lastFailureTime: circuit.lastFailureTime,
      }),
      {
        status: allowed ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Record successful request
   */
  private async handleRecordSuccess(request: Request): Promise<Response> {
    const body = await request.json() as { key: string };

    if (!body.key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const circuit = this.circuits.get(body.key);
    if (!circuit) {
      return new Response(
        JSON.stringify({ error: 'Circuit not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    this.stats.totalSuccesses++;
    circuit.successes++;

    if (circuit.state === 'HALF_OPEN') {
      // Check if should close circuit
      if (circuit.successes >= circuit.successThreshold) {
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        circuit.successes = 0;
        circuit.lastStateChange = Date.now();
        this.stats.circuitCloses++;
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset failure count on success
      circuit.failures = 0;
    }

    await this.persist();

    return new Response(
      JSON.stringify({
        success: true,
        state: circuit.state,
        successes: circuit.successes,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Record failed request
   */
  private async handleRecordFailure(request: Request): Promise<Response> {
    const body = await request.json() as { key: string };

    if (!body.key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const circuit = this.circuits.get(body.key);
    if (!circuit) {
      return new Response(
        JSON.stringify({ error: 'Circuit not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    this.stats.totalFailures++;
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'HALF_OPEN') {
      // Go back to OPEN on any failure in HALF_OPEN
      circuit.state = 'OPEN';
      circuit.successes = 0;
      circuit.lastStateChange = Date.now();
      this.stats.circuitOpens++;
    } else if (circuit.state === 'CLOSED') {
      // Check if should open circuit
      if (circuit.failures >= circuit.failureThreshold) {
        circuit.state = 'OPEN';
        circuit.lastStateChange = Date.now();
        this.stats.circuitOpens++;
      }
    }

    await this.persist();

    return new Response(
      JSON.stringify({
        success: true,
        state: circuit.state,
        failures: circuit.failures,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Reset circuit breaker
   */
  private async handleReset(request: Request): Promise<Response> {
    const body = await request.json() as { key: string };

    if (!body.key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const circuit = this.circuits.get(body.key);
    if (circuit) {
      circuit.state = 'CLOSED';
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.lastStateChange = Date.now();
      await this.persist();
    }

    return new Response(
      JSON.stringify({ success: true, reset: !!circuit }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get circuit breaker statistics
   */
  private handleStats(request: Request): Response {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key) {
      const circuit = this.circuits.get(key);
      if (!circuit) {
        return new Response(
          JSON.stringify({ error: 'Circuit not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          key,
          ...circuit,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Global stats
    const failureRate = this.stats.totalRequests > 0
      ? this.stats.totalFailures / this.stats.totalRequests
      : 0;

    return new Response(
      JSON.stringify({
        ...this.stats,
        failureRate,
        activeCircuits: this.circuits.size,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Persist state to durable storage
   */
  private async persist(): Promise<void> {
    await this.state.storage.put("state", {
      circuits: Array.from(this.circuits.entries()),
      stats: this.stats,
    });
  }

  /**
   * Cleanup old circuits periodically
   */
  async alarm(): Promise<void> {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    let cleaned = 0;

    for (const [key, circuit] of this.circuits.entries()) {
      if (now - circuit.lastStateChange > maxAge && circuit.state === 'CLOSED') {
        this.circuits.delete(key);
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
