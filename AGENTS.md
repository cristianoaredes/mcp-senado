# Repository Guidelines

## Project Structure & Module Organization
TypeScript source lives in `lib/`, split by concern: `core/` defines the MCP server and tool registry, `tools/` hosts Senado-facing commands, `infrastructure/` contains cache, HTTP, and rate limiting utilities, and `bin/` exposes the runnable entry points that compile to `build/bin/`. Shared schemas and types live under `lib/types/`, while Cloudflare Worker glue code resides in `lib/workers/`. Tests mirror runtime folders inside `test/core`, `test/integration`, `test/e2e`, and `test/infrastructure`. Supporting docs live in `docs/` and automation scripts stay in `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` – watches `lib/bin/mcp-senado.ts` with `tsx` for local TCP development.
- `npm run dev:http` – launches the Express transport for REST-based testing.
- `npm run build` – compiles strict ESM output and declarations into `build/`.
- `npm run test` / `npm run test:watch` – runs Vitest across all suites once or continuously.
- `npm run test:coverage` – captures V8 coverage; keep the number close to the published ~73%.
- `npm run lint` – performs type-level linting via `tsc --noEmit`.
- `npm run smoke` – executes `scripts/smoke-test.ts` to validate Senado API connectivity.

## Coding Style & Naming Conventions
Stick to ES modules, 2-space indentation, and explicit return types. Favor named exports and directory `index.ts` barrels, as shown in `lib/index.ts`. File names stay kebab-case (`senators-tool.ts`), while exported classes, schemas, and Zod objects use `PascalCase`, and helpers use `camelCase`. Keep error messages actionable, and run `npm run lint` before committing because no formatter runs in CI.

## Testing Guidelines
Add unit specs beside the closest runtime analog within `test/<area>`, using `.spec.ts` or `.test.ts` suffixes that reflect the tool name (`proposals.spec.ts`). Mock Senado responses with the shared fixtures/utilities already in `test`. Vitest configuration lives in `vitest.config.ts`; update integration or e2e suites whenever new endpoints or resilience layers are added. Aim to maintain baseline coverage and capture failures with `npm run test:coverage` before opening a PR.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat:`, `refactor:`, `chore:`) to keep changelog automation consistent with the existing history. PRs should explain why the change is needed, list noteworthy modifications, include `npm run test` (and `npm run smoke` when touching transport code) output, and link any GitHub issue or ROADMAP item. Call out required env toggles such as `MCP_LOG_LEVEL`, `MCP_RATE_LIMIT_*`, or cache settings whenever behavior depends on configuration.

## Security & Configuration Tips
Store secrets in `.env.local` or `wrangler secret put` rather than committing them. Default to `MCP_CACHE_ENABLED=true`, rate limiting, and the circuit breaker values advertised in the README to protect the Senado API. Drop `MCP_LOG_LEVEL` to `debug` only during short debugging sessions and avoid checking verbose trace logs into version control.
