/**
 * Metrics Durable Object
 *
 * Aggregates metrics and statistics across all Cloudflare Workers instances.
 * Provides real-time analytics and monitoring.
 */

export interface ToolMetrics {
  invocations: number;
  successes: number;
  failures: number;
  totalDuration: number;
  lastInvocation: number;
}

export interface GlobalMetrics {
  totalInvocations: number;
  totalSuccesses: number;
  totalFailures: number;
  totalDuration: number;
  startTime: number;
  tools: Map<string, ToolMetrics>;
  categories: Map<string, number>;
  hourlyInvocations: Map<string, number>;
}

export class MetricsDurableObject {
  private state: DurableObjectState;
  private metrics: GlobalMetrics;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.metrics = {
      totalInvocations: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalDuration: 0,
      startTime: Date.now(),
      tools: new Map(),
      categories: new Map(),
      hourlyInvocations: new Map(),
    };

    // Initialize from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<{
        metrics: Omit<GlobalMetrics, 'tools' | 'categories' | 'hourlyInvocations'> & {
          tools: [string, ToolMetrics][];
          categories: [string, number][];
          hourlyInvocations: [string, number][];
        };
      }>("state");

      if (stored) {
        this.metrics = {
          ...stored.metrics,
          tools: new Map(stored.metrics.tools),
          categories: new Map(stored.metrics.categories),
          hourlyInvocations: new Map(stored.metrics.hourlyInvocations),
        };
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
      if (request.method === 'POST' && path === '/record') {
        return await this.handleRecord(request);
      }

      if (request.method === 'GET' && (path === '/stats' || path === '/global')) {
        return this.handleStats(request);
      }

      if (
        request.method === 'GET' &&
        (path === '/tool' || path === '/tools' || path.startsWith('/tool/'))
      ) {
        const pathTool = path.startsWith('/tool/')
          ? decodeURIComponent(path.slice('/tool/'.length))
          : undefined;
        return this.handleToolStats(request, pathTool);
      }

      if (
        request.method === 'GET' &&
        (path === '/category' || path === '/categories' || path.startsWith('/category/'))
      ) {
        const pathCategory = path.startsWith('/category/')
          ? decodeURIComponent(path.slice('/category/'.length))
          : undefined;
        return this.handleCategoryStats(request, pathCategory);
      }

      if (request.method === 'GET' && path === '/hourly') {
        return this.handleHourly();
      }

      if (request.method === 'POST' && path === '/reset') {
        return await this.handleReset();
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
   * Record tool invocation
   */
  private async handleRecord(request: Request): Promise<Response> {
    const body = await request.json() as {
      tool: string;
      category: string;
      success: boolean;
      duration: number;
    };

    if (!body.tool || !body.category) {
      return new Response(
        JSON.stringify({ error: 'Missing tool or category' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update global metrics
    this.metrics.totalInvocations++;
    this.metrics.totalDuration += body.duration;

    if (body.success) {
      this.metrics.totalSuccesses++;
    } else {
      this.metrics.totalFailures++;
    }

    // Update tool metrics
    let toolMetrics = this.metrics.tools.get(body.tool);
    if (!toolMetrics) {
      toolMetrics = {
        invocations: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        lastInvocation: 0,
      };
      this.metrics.tools.set(body.tool, toolMetrics);
    }

    toolMetrics.invocations++;
    toolMetrics.totalDuration += body.duration;
    toolMetrics.lastInvocation = Date.now();

    if (body.success) {
      toolMetrics.successes++;
    } else {
      toolMetrics.failures++;
    }

    // Update category metrics
    const categoryCount = this.metrics.categories.get(body.category) || 0;
    this.metrics.categories.set(body.category, categoryCount + 1);

    // Update hourly metrics
    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const hourlyCount = this.metrics.hourlyInvocations.get(hour) || 0;
    this.metrics.hourlyInvocations.set(hour, hourlyCount + 1);

    // Cleanup old hourly data (keep last 24 hours)
    this.cleanupHourlyData();

    await this.persist();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get global statistics
   */
  private handleStats(_request: Request): Response {
    const uptime = Date.now() - this.metrics.startTime;
    const avgDuration = this.metrics.totalInvocations > 0
      ? this.metrics.totalDuration / this.metrics.totalInvocations
      : 0;
    const successRate = this.metrics.totalInvocations > 0
      ? this.metrics.totalSuccesses / this.metrics.totalInvocations
      : 0;

    const hourlyData = this.getHourlyData();

    return new Response(
      JSON.stringify({
        totalInvocations: this.metrics.totalInvocations,
        totalSuccesses: this.metrics.totalSuccesses,
        totalFailures: this.metrics.totalFailures,
        totalDuration: this.metrics.totalDuration,
        averageDuration: avgDuration,
        avgDuration,
        successRate,
        uptime,
        startTime: this.metrics.startTime,
        totalTools: this.metrics.tools.size,
        totalCategories: this.metrics.categories.size,
        hourlyData,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private handleHourly(): Response {
    const hourly = this.getHourlyData();

    return new Response(
      JSON.stringify({ hourly }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get tool-specific statistics
   */
  private handleToolStats(request: Request, pathTool?: string): Response {
    const url = new URL(request.url);
    const tool = pathTool ?? url.searchParams.get('name');

    if (!tool) {
      // Return all tools
      const tools = Array.from(this.metrics.tools.entries()).map(([name, metrics]) => {
        const averageDuration = metrics.invocations > 0
          ? metrics.totalDuration / metrics.invocations
          : 0;

        return {
          name,
          invocations: metrics.invocations,
          successRate: metrics.invocations > 0 ? metrics.successes / metrics.invocations : 0,
          avgDuration: averageDuration,
          averageDuration,
          lastInvocation: metrics.lastInvocation,
        };
      });

      // Sort by invocations descending
      tools.sort((a, b) => b.invocations - a.invocations);

      return new Response(
        JSON.stringify({ tools }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const toolMetrics = this.metrics.tools.get(tool);
    if (!toolMetrics) {
      return new Response(
        JSON.stringify({ error: 'Tool not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const successRate = toolMetrics.invocations > 0
      ? toolMetrics.successes / toolMetrics.invocations
      : 0;
    const avgDuration = toolMetrics.invocations > 0
      ? toolMetrics.totalDuration / toolMetrics.invocations
      : 0;

    return new Response(
      JSON.stringify({
        tool,
        ...toolMetrics,
        successRate,
        avgDuration,
        averageDuration: avgDuration,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get category statistics
   */
  private handleCategoryStats(request: Request, pathCategory?: string): Response {
    const url = new URL(request.url);
    const category = pathCategory ?? url.searchParams.get('name');

    if (category) {
      const count = this.metrics.categories.get(category);
      if (count === undefined) {
        return new Response(
          JSON.stringify({ error: 'Category not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ category, invocations: count }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return all categories
    const categories = Array.from(this.metrics.categories.entries())
      .map(([name, count]) => ({ name, invocations: count }))
      .sort((a, b) => b.invocations - a.invocations);

    return new Response(
      JSON.stringify({ categories }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Reset all metrics
   */
  private async handleReset(): Promise<Response> {
    this.metrics = {
      totalInvocations: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalDuration: 0,
      startTime: Date.now(),
      tools: new Map(),
      categories: new Map(),
      hourlyInvocations: new Map(),
    };

    await this.persist();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private getHourlyData(): { hour: string; count: number }[] {
    return Array.from(this.metrics.hourlyInvocations.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, count]) => ({ hour, count }));
  }

  /**
   * Cleanup old hourly data (keep last 24 hours)
   */
  private cleanupHourlyData(): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    const cutoffHour = cutoff.toISOString().slice(0, 13);

    for (const [hour] of this.metrics.hourlyInvocations.entries()) {
      if (hour < cutoffHour) {
        this.metrics.hourlyInvocations.delete(hour);
      }
    }
  }

  /**
   * Persist state to durable storage
   */
  private async persist(): Promise<void> {
    await this.state.storage.put("state", {
      metrics: {
        totalInvocations: this.metrics.totalInvocations,
        totalSuccesses: this.metrics.totalSuccesses,
        totalFailures: this.metrics.totalFailures,
        totalDuration: this.metrics.totalDuration,
        startTime: this.metrics.startTime,
        tools: Array.from(this.metrics.tools.entries()),
        categories: Array.from(this.metrics.categories.entries()),
        hourlyInvocations: Array.from(this.metrics.hourlyInvocations.entries()),
      },
    });
  }

  /**
   * Periodic cleanup
   */
  async alarm(): Promise<void> {
    this.cleanupHourlyData();
    await this.persist();

    // Schedule next cleanup (every hour)
    await this.state.storage.setAlarm(Date.now() + 3600000);
  }
}
