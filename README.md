# MCP Senado Federal — Brazilian Senate Open Data for AI Assistants

> Connect Claude, Cursor, Windsurf, and Continue.dev to the Brazilian Federal Senate (Senado Federal) legislative database with 56 tools covering senators, bills, voting records, committees, and plenary sessions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/cristianoaredes/mcp-senado/actions/workflows/ci.yml/badge.svg)](https://github.com/cristianoaredes/mcp-senado/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![NPM](https://img.shields.io/badge/npm-%40aredes.me%2Fmcp--senado-red.svg)](https://www.npmjs.com/package/@aredes.me/mcp-senado)

[English](./README.en.md) | [Português](#) | [Contributing](./CONTRIBUTING.md)

---

## What is this?

**MCP Senado Federal** is a Model Context Protocol (MCP) server that gives AI assistants direct access to the official [Brazilian Federal Senate Open Data API](https://legis.senado.leg.br/dadosabertos). Once configured, you can ask Claude (or any MCP-compatible client) natural-language questions about Brazilian legislative data and get accurate, real-time answers sourced from the government's own API.

**Who is it for?**
- Data journalists investigating voting patterns or legislative proposals
- Academic researchers studying Brazilian parliamentary behavior
- Developers building civic tech apps or political dashboards
- Citizens and activists tracking specific bills or senators

---

## Features

- **56 tools across 7 categories** — senators, proposals, voting, committees, parties, plenary sessions, and reference data
- **Multi-transport** — stdio (native MCP) and HTTP/REST API modes
- **Production-ready** — circuit breaker, rate limiting, in-memory LRU cache, structured logging, and health checks
- **Deployable anywhere** — run locally via npx, Docker, or deploy globally on Cloudflare Workers (300+ edge locations)
- **Secure by default** — Zod input validation, optional bearer token auth, configurable CORS, PII masking, LGPD-compliant
- **Type-safe** — full TypeScript 5.7 with strict mode; 211 passing tests at 73% coverage
- **Bilingual** — documentation and tool descriptions in Portuguese and English

---

## Available MCP Tools

### Reference Data (10 tools)

| Tool | Description |
|---|---|
| `ufs_listar` | List all Brazilian states (UFs) |
| `legislaturas_listar` | List Senate legislatures |
| `tipos_materia_listar` | List legislative proposal types |
| `situacoes_materia_listar` | List bill processing statuses |
| `tipos_comissao_listar` | List committee types |
| `tipos_autor_listar` | List author types |
| `tipos_sessao_listar` | List session types |
| `tipos_votacao_listar` | List voting types |
| `tipos_documento_listar` | List document types |
| `assuntos_listar` | List subject classifications |

### Senators (13 tools)

| Tool | Description |
|---|---|
| `senadores_listar` | Search senators by name, party, state, or legislature |
| `senador_detalhes` | Full details and biography for a specific senator |
| `senador_historico` | Parliamentary history and previous terms |
| `senador_votacoes` | Senator's voting record with filters |
| `senador_materias` | Bills and proposals authored by the senator |
| `senador_discursos` | Speeches delivered by the senator |
| `senador_licencas` | Leaves of absence |
| `senador_comissoes` | Committee memberships |
| `senador_liderancas` | Leadership positions held |
| `senador_filiacao` | Party affiliation history |
| `senador_profissoes` | Declared professions |
| `senador_apartes` | Interjections made on the floor |
| `senador_relatorias` | Bills the senator has rapporteured |

### Legislative Proposals (12 tools)

| Tool | Description |
|---|---|
| `materias_pesquisar` | Advanced search for bills and proposals |
| `materia_detalhes` | Full details of a specific proposal |
| `materia_texto` | Full text of a bill |
| `materia_votacoes` | Voting sessions related to a proposal |
| `materia_tramitacao` | Processing history and current status |
| `materia_autores` | Authors and co-authors |
| `materia_relacionadas` | Related bills |
| `materia_emendas` | Amendments filed |
| `materia_pareceres` | Committee opinions |
| `materia_notas_tecnicas` | Technical notes |
| `materia_audiencias` | Related public hearings |
| `materia_documentos` | Attached documents |

### Voting (5 tools)

| Tool | Description |
|---|---|
| `votacoes_listar` | List voting sessions with filters |
| `votacao_detalhes` | Full details of a specific vote |
| `votacao_votos` | Individual senator votes for a session |
| `votacao_orientacoes` | Party/bloc voting orientations |
| `votacao_resumo` | Statistical summary of a vote |

### Committees (5 tools)

| Tool | Description |
|---|---|
| `comissoes_listar` | List all committees (permanent and temporary) |
| `comissao_detalhes` | Committee details |
| `comissao_membros` | Committee membership and composition |
| `comissao_reunioes` | Meeting schedule and agendas |
| `comissao_materias` | Bills under committee review |

### Parties (5 tools)

| Tool | Description |
|---|---|
| `partidos_listar` | List all parties and parliamentary blocs |
| `partido_detalhes` | Party details |
| `partido_membros` | Senators affiliated with the party |
| `partido_liderancas` | Party leadership |
| `blocos_listar` | Parliamentary blocs and coalitions |

### Plenary Sessions (6 tools)

| Tool | Description |
|---|---|
| `sessoes_listar` | Session calendar with filters |
| `sessao_detalhes` | Details of a specific session |
| `sessao_votacoes` | Votes held during a session |
| `sessao_discursos` | Speeches delivered during a session |
| `sessao_ordem_dia` | Session agenda (order of the day) |
| `sessao_expediente` | Session dispatch (expediente) |

---

## Installation

### Requirements

- Node.js 18.x or higher
- npm 9.x or higher

### Option 1 — npx (no install needed)

```bash
npx @aredes.me/mcp-senado
```

### Option 2 — Global install

```bash
npm install -g @aredes.me/mcp-senado
mcp-senado
```

### Option 3 — Clone and build

```bash
git clone https://github.com/cristianoaredes/mcp-senado.git
cd mcp-senado
npm install
npm run build
```

---

## Usage — Connect to an AI Assistant

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "senado-federal": {
      "command": "npx",
      "args": ["-y", "@aredes.me/mcp-senado"],
      "env": {
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

Config file locations:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Cursor / Windsurf

```json
{
  "mcpServers": {
    "senado-federal": {
      "command": "npx",
      "args": ["-y", "@aredes.me/mcp-senado"]
    }
  }
}
```

### Continue.dev

```json
{
  "mcpServers": [
    {
      "name": "senado-federal",
      "command": "npx",
      "args": ["-y", "@aredes.me/mcp-senado"]
    }
  ]
}
```

### Example prompts

Once connected, ask your AI assistant:

```
"List all senators from São Paulo"
"What is the voting record of Senator X on environmental bills?"
"Find all education bills introduced in 2024"
"What is the current status of PLS 123/2024?"
"Show the composition of the CCJ committee"
"How many senators does each party have?"
```

---

## HTTP Server Mode

Run the server as a standalone REST API for web applications:

```bash
# Development
npm run dev:http

# Production
npm run build && npm run start:http

# Via npx
npx @aredes.me/mcp-senado-http
```

Base URL: `http://localhost:3000`

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check and server status |
| `/mcp` | POST | MCP JSON-RPC endpoint |
| `/sse` | GET | Server-Sent Events for MCP clients |
| `/api/tools` | GET | List all available tools |
| `/api/tools/:name` | GET | Get tool details |
| `/api/tools/:name` | POST | Invoke a tool |
| `/api/categories` | GET | List all categories |
| `/api/tools/category/:category` | GET | Tools by category |

**Example — invoke a tool via HTTP:**

```bash
curl -X POST http://localhost:3000/api/tools/senadores_listar \
  -H "Content-Type: application/json" \
  -d '{"uf": "SP"}'
```

---

## Docker

```bash
# Quick start
docker-compose up -d

# Manual build and run
docker build -t mcp-senado:latest .
docker run -d --name mcp-senado -p 3000:3000 mcp-senado:latest

# Check status
curl http://localhost:3000/health
```

---

## Cloudflare Workers

Deploy to 300+ global edge locations:

```bash
npm install -g wrangler
wrangler login
npm run build
npm run deploy:workers:production
```

Local development with hot reload:

```bash
npm run dev:workers   # starts at http://localhost:8787
```

---

## Configuration

Create a `.env` file or set environment variables:

```bash
# API
SENADO_API_BASE_URL=https://legis.senado.leg.br/dadosabertos/

# Cache
MCP_CACHE_ENABLED=true
MCP_CACHE_TTL=300

# Rate limiting
MCP_RATE_LIMIT_ENABLED=true
MCP_RATE_LIMIT_MAX_REQUESTS=30
MCP_RATE_LIMIT_WINDOW_MS=60000

# HTTP server
HTTP_PORT=3000
HTTP_AUTH_ENABLED=false
HTTP_AUTH_TOKEN=

# Logging
MCP_LOG_LEVEL=info
```

---

## Architecture

```
AI Assistants (Claude, Cursor, Windsurf, Continue.dev)
    ↓ MCP Protocol (stdio / HTTP / SSE)
Adapters Layer (CLI, HTTP Server, Cloudflare Workers)
    ↓
Core Layer (MCP Server, Tool Registry, Zod Validation)
    ↓
Tools Layer (Senator, Proposal, Voting, Committee, Party, Session, Reference)
    ↓
Infrastructure Layer (HTTP Client, LRU Cache, Circuit Breaker, Rate Limiter)
    ↓ HTTPS
Senado Federal Open Data API (legis.senado.leg.br/dadosabertos)
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines, code of conduct, and how to submit pull requests.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

Data is sourced from the [Brazilian Federal Senate Open Data API](https://legis.senado.leg.br/dadosabertos), a public service maintained by the Brazilian government.

---

## Related Projects

- [mcp-camara](https://github.com/cristianoaredes/mcp-camara) — MCP server for the Brazilian Chamber of Deputies
- [mcp-dadosbr](https://github.com/cristianoaredes/mcp-dadosbr) — MCP server for Brazilian public datasets

---

by [Cristiano Arêdes](https://github.com/cristianoaredes)
