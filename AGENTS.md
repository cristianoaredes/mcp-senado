# Repository Guidelines

## Project Structure & Module Organization
TypeScript source lives in `lib/`: `core/` owns the MCP server and tool registry, `tools/` exposes Senado commands, `infrastructure/` handles cache, HTTP, and resilience helpers, and `bin/` contains the runnable entries that compile to `build/bin/`. Shared schemas sit in `lib/types/`, while Worker glue code is in `lib/workers/`. Tests mirror runtime folders under `test/` (`core`, `integration`, `e2e`, `infrastructure`).

## Build, Test, and Development Commands
- `npm run dev` – watches `lib/bin/mcp-senado.ts` with `tsx` for local TCP development.
- `npm run dev:http` – launches the Express transport for REST-based testing.
- `npm run build` – compiles strict ESM output and declarations into `build/`.
- `npm run test` / `npm run test:watch` – runs Vitest across all suites once or continuously.
- `npm run test:coverage` – captures V8 coverage; keep the number close to the published ~73%.
- `npm run lint` – performs type-level linting via `tsc --noEmit`.
- `npm run smoke` – executes `scripts/smoke-test.ts` to validate Senado API connectivity.

## Coding Style & Naming Conventions
Stick to ES modules, 2-space indentation, and explicit return types. Favor named exports and directory `index.ts` barrels, as shown in `lib/index.ts`. Files stay kebab-case (`senators-tool.ts`); exported classes, schemas, and Zod objects use `PascalCase`, helpers use `camelCase`. Keep error messages actionable and run `npm run lint` before committing because no formatter runs in CI.

## Testing Guidelines
Add unit specs beside the closest runtime analog within `test/<area>`, using `.spec.ts` or `.test.ts` suffixes tied to the tool name (`proposals.spec.ts`). Mock Senado responses with the shared fixtures/utilities in `test`. Vitest reads from `vitest.config.ts`; update integration or e2e suites whenever new endpoints or resilience layers ship. Maintain baseline coverage locally with `npm run test:coverage` before opening a PR.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat:`, `refactor:`, `chore:`) to match the existing history. PRs should explain motivation, summarize code changes, include `npm run test` (and `npm run smoke` when touching transports) output, and link any GitHub issue or ROADMAP item. Call out env toggles such as `MCP_LOG_LEVEL`, `MCP_RATE_LIMIT_*`, or cache settings whenever behavior depends on configuration.

## Security & Configuration Tips
Store secrets in `.env.local` or `wrangler secret put` rather than committing them. Default to `MCP_CACHE_ENABLED=true`, rate limiting, and the circuit breaker values listed in the README to protect the Senado API. Drop `MCP_LOG_LEVEL` to `debug` only during targeted debugging and keep verbose trace logs out of version control.
