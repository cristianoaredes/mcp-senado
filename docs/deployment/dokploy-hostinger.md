# Deploying MCP Senado to Dokploy on Hostinger VPS

This guide documents how to run the HTTP adapter of MCP Senado Federal on a Hostinger VPS managed through [Dokploy](https://dokploy.com/).

## 1. Prerequisites

- Hostinger VPS with Docker installed (Dokploy requires Docker Engine ≥ 24).
- Dokploy instance already provisioned on the VPS.
- GitHub access token (if Dokploy will pull the repository directly).
- Domain/subdomain ready to point to the Dokploy-managed application.

## 2. Repository & Environment Preparation

1. Clone the repo locally and copy `.env.example` to `.env`.
2. Fill in the required variables. For HTTP deployments Dokploy must expose these keys (defaults shown):

| Variable | Description | Default |
| --- | --- | --- |
| `MCP_TRANSPORT` | Transport mode (`http` for Dokploy) | `http` |
| `HTTP_PORT` | Internal HTTP port exposed by container | `3000` |
| `HTTP_HOST` | Bind address inside the container | `0.0.0.0` |
| `HTTP_CORS_ORIGIN` | Allowed origins (comma separated) | `*` |
| `HTTP_AUTH_ENABLED` / `HTTP_AUTH_TOKEN` | Optional bearer auth for REST API | `false` / _(empty)_ |
| `SENADO_API_BASE_URL` | Senado open-data endpoint | `https://legis.senado.leg.br/dadosabertos` |
| `SENADO_API_TIMEOUT` | Upstream timeout in ms | `30000` |
| `SENADO_API_MAX_RETRIES` | Retry attempts for API failures | `3` |
| `SENADO_API_RETRY_DELAY` | Delay between retries (ms) | `1000` |
| `MCP_CACHE_ENABLED` / `MCP_CACHE_TTL` / `MCP_CACHE_MAX_SIZE` | Cache controls | `true` / `300000` / `1000` |
| `MCP_RATE_LIMIT_ENABLED` / `MCP_RATE_LIMIT_TOKENS` / `MCP_RATE_LIMIT_INTERVAL` / `MCP_RATE_LIMIT_REFILL_RATE` | Token bucket options | `true` / `30` / `60000` / `2000` |
| `MCP_CIRCUIT_BREAKER_ENABLED` / `MCP_CIRCUIT_BREAKER_FAILURE_THRESHOLD` / `MCP_CIRCUIT_BREAKER_SUCCESS_THRESHOLD` / `MCP_CIRCUIT_BREAKER_TIMEOUT` | Circuit breaker | `true` / `5` / `2` / `60000` |
| `MCP_LOG_LEVEL` / `MCP_LOG_FORMAT` / `MCP_LOG_MASK_PII` | Logging | `INFO` / `json` / `true` |

> ℹ️ Both `HTTP_*` and `MCP_*` values are now recognized by the runtime, so a single `.env` drives local, Dokploy, and container deployments without manual tweaks.

## 3. Dokploy Deployment Options

### Option A – Build via Dockerfile (recommended)

1. In Dokploy, create a **Docker** application.
2. Point it to the Git repository and select the main branch.
3. Under build settings, use the repository Dockerfile (multi-stage build with Node 18 and `dumb-init`).
4. Set the container port to `3000` and map it to Dokploy’s service port (Dokploy usually fronts it with Traefik / Caddy on :80/:443).
5. Add the environment variables from section 2 in Dokploy’s “Environment” tab.
6. Deploy; Dokploy will run `docker build` → `docker run` and expose `/health` for readiness checks.

### Option B – Node runtime (manual)

If you prefer Dokploy’s Node template:

1. Create a **Node** application.
2. Build command: `npm ci && npm run build`.
3. Start command: `node build/bin/mcp-senado-http.js`.
4. Port and environment variables same as Option A.

## 4. Hostinger Networking Checklist

1. Point your DNS (e.g., `senado.yourdomain.com`) to the VPS IP.
2. In Dokploy, add the domain to the application so Traefik/Caddy provisions TLS.
3. Ensure outbound HTTPS (port 443) is open in Hostinger’s firewall so the server can call `https://legis.senado.leg.br`.

## 5. Verification

1. After deployment, check Dokploy logs to ensure the server reports `MCP Senado Federal HTTP Server is running`.
2. Visit `{your-domain}/health` – you should see JSON containing `status`, `tools`, and `categories`.
3. Test a tool invocation:

```bash
curl -X POST https://{your-domain}/api/tools/senadores_listar \
  -H "Content-Type: application/json" \
  -d '{"uf":"SP"}'
```

4. If `HTTP_AUTH_ENABLED=true`, append `-H "Authorization: Bearer <token>"`.

## 6. Maintenance Tips

- Use Dokploy’s automatic redeploy on Git push to keep Hostinger in sync with GitHub.
- Monitor resource usage in Dokploy; default compose limits (1 CPU / 512 MB) map well to Hostinger’s smallest VPS, but increase if cache TTL or concurrency goes up.
- Schedule `docker image prune` or Dokploy cleanup tasks to avoid disk pressure on the VPS.

With this flow, Dokploy acts as the orchestration layer while Hostinger simply provides compute, letting you reuse the same Docker image and environment variables across development, staging, and production.
