# SSE Transport Plan

This note outlines the work needed to add Server-Sent Events (SSE) support to the MCP Senado HTTP adapter and Cloudflare Workers deployment.

## Goals
- Stream tool invocation output incrementally to clients that support SSE (Claude, Cursor, custom dashboards).
- Maintain parity between the Express adapter and the Workers adapter.
- Ensure rate limiting, authentication, and logging keep working for streaming sessions.

## Proposed Architecture
1. **Express Adapter**
   - Add a new endpoint (`GET /stream/tools/:name`).
   - Use `response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' })`.
   - Invoke the requested tool and, instead of waiting for the final `ToolResult`, forward progress updates (e.g., cache hits, HTTP retries, final payload) as SSE `data:` frames.
   - Provide a `close` handler to abort tool execution if the client disconnects.

2. **Workers Adapter**
   - Implement the same endpoint using the [Streams API](https://developers.cloudflare.com/workers/runtime-apis/streams/).
   - Use a `TransformStream` to write SSE events while the tool executes.
   - Respect Durable Object rate limiting and circuit breaker checks before starting the stream.

3. **Tool Execution Hooks**
   - Extend `ToolRegistry` so handlers can optionally emit progress callbacks (e.g., `context.emit('log', payload)`).
   - Default implementations will emit at least two events: `start` and `complete`.
   - Infrastructure components (HTTP client retries, cache writes) can tap into the emitter for richer telemetry later.

4. **Client Experience**
   - Document how to consume the SSE endpoint (simple curl example, Node sample).
   - Update README with a `stream` usage section + note about env var `MCP_STREAM_ENABLED`.
   - Keep the existing REST endpoints unchanged.

## Work Breakdown
1. **Registry/Event API (1 day)**
   - Introduce a lightweight event emitter in `ToolContext`.
   - Update a couple of representative tools to emit progress (e.g., `ufs_listar`, `senadores_listar`).

2. **Express SSE Endpoint (1 day)**
   - Reuse the emitter to forward tool events as SSE frames.
   - Add auth + rate limiting guards.

3. **Workers SSE Endpoint (1-2 days)**
   - Mirror the behavior using `ReadableStream`/`WritableStream`.
   - Add integration tests in `test/e2e` to ensure streaming sessions complete.

4. **Docs + Examples (0.5 day)**
   - README updates, example scripts, smoke-test entry.

5. **Stretch**
   - Surface SSE telemetry via the Metrics Durable Object (stream counts, average duration).

This plan keeps streaming optional (flag-guarded) while laying the groundwork for richer, incremental updates in future releases.
