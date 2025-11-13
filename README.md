# MCP Senado Federal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

MCP (Model Context Protocol) server for the Brazilian Federal Senate (Senado Federal) Open Data API. Enable AI assistants like Claude, Cursor, Windsurf, and Continue.dev to access comprehensive legislative data from the Brazilian Senate.

## 🎯 Features

- **56 Tools** across 7 categories for comprehensive legislative data access
- **Multi-Transport**: stdio (MCP standard) and HTTP/REST API
- **Production-Ready**: Circuit breaker, rate limiting, caching, and monitoring
- **Type-Safe**: Full TypeScript with strict mode
- **Well-Documented**: Complete documentation in Portuguese and English
- **Secure**: Input validation, PII masking, and LGPD compliance

## 📦 Installation

### NPM (Recommended)

```bash
npm install -g @aredes.me/mcp-senado
```

### Direct Execution

```bash
npx @aredes.me/mcp-senado
```

## 🚀 Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "senado": {
      "command": "npx",
      "args": ["@aredes.me/mcp-senado"]
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings:

```json
{
  "mcpServers": {
    "senado": {
      "command": "npx",
      "args": ["@aredes.me/mcp-senado"]
    }
  }
}
```

### Continue.dev

Add to your `config.json`:

```json
{
  "mcpServers": [
    {
      "name": "senado",
      "command": "npx",
      "args": ["@aredes.me/mcp-senado"]
    }
  ]
}
```

## 🌐 HTTP Server Mode

Run the server as a standalone HTTP API for web applications and services:

### Starting the Server

**Development Mode:**
```bash
npm run dev:http
```

**Production Mode:**
```bash
npm run build
npm run start:http
```

**Using npx:**
```bash
npx @aredes.me/mcp-senado-http
```

### HTTP Endpoints

Base URL: `http://localhost:3000`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and server status |
| `/api/tools` | GET | List all available tools |
| `/api/tools/:name` | GET | Get specific tool details |
| `/api/tools/:name` | POST | Invoke a tool |
| `/api/tools/category/:category` | GET | List tools by category |
| `/api/categories` | GET | List all categories |

### Example Requests

**Health Check:**
```bash
curl http://localhost:3000/health
```

**List All Tools:**
```bash
curl http://localhost:3000/api/tools
```

**Get Tool Details:**
```bash
curl http://localhost:3000/api/tools/ufs_listar
```

**Invoke a Tool:**
```bash
curl -X POST http://localhost:3000/api/tools/senadores_listar \
  -H "Content-Type: application/json" \
  -d '{"uf": "SP"}'
```

**With Authentication:**
```bash
curl -X POST http://localhost:3000/api/tools/senadores_listar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{"uf": "SP"}'
```

### HTTP Configuration

Set these environment variables in your `.env` file:

```bash
# HTTP Server
HTTP_PORT=3000                    # Server port
HTTP_HOST=0.0.0.0                 # Bind address
HTTP_CORS_ORIGIN=*                # CORS allowed origin
HTTP_AUTH_ENABLED=false           # Enable bearer token auth
HTTP_AUTH_TOKEN=                  # Authentication token
HTTP_REQUEST_TIMEOUT=30000        # Request timeout (ms)
```

## 🐳 Docker Deployment

Run the server in a Docker container for isolated, portable deployment:

### Quick Start with Docker Compose

**1. Clone and configure:**
```bash
git clone https://github.com/cristianoaredes/mcp-senado.git
cd mcp-senado
cp .env.example .env  # Edit .env as needed
```

**2. Run with Docker Compose:**
```bash
docker-compose up -d
```

**3. Check status:**
```bash
docker-compose ps
docker-compose logs -f
curl http://localhost:3000/health
```

**4. Stop the service:**
```bash
docker-compose down
```

### Manual Docker Build

**Build the image:**
```bash
docker build -t mcp-senado:latest .
```

**Run HTTP server:**
```bash
docker run -d \
  --name mcp-senado \
  -p 3000:3000 \
  -e HTTP_PORT=3000 \
  -e MCP_LOG_LEVEL=info \
  mcp-senado:latest
```

**Run with custom environment:**
```bash
docker run -d \
  --name mcp-senado \
  -p 8080:8080 \
  --env-file .env \
  -e HTTP_PORT=8080 \
  -e HTTP_AUTH_ENABLED=true \
  -e HTTP_AUTH_TOKEN=your-secret-token \
  mcp-senado:latest
```

**View logs:**
```bash
docker logs -f mcp-senado
```

**Stop and remove:**
```bash
docker stop mcp-senado
docker rm mcp-senado
```

### Docker Image Details

- **Base image:** node:18-alpine
- **Image size:** ~150MB (multi-stage build)
- **User:** Non-root user (nodejs:1001)
- **Health check:** Built-in HTTP health check on /health
- **Security:** Runs as non-root, uses dumb-init for signal handling

### Environment Variables

All configuration variables from `.env.example` can be passed to Docker:
- API Configuration: `SENADO_API_BASE_URL`
- HTTP Server: `HTTP_PORT`, `HTTP_HOST`, `HTTP_CORS_ORIGIN`, `HTTP_AUTH_*`
- Cache: `MCP_CACHE_ENABLED`, `MCP_CACHE_TTL`, `MCP_CACHE_MAX_SIZE`
- Rate Limiting: `MCP_RATE_LIMIT_*`
- Circuit Breaker: `MCP_CIRCUIT_BREAKER_*`
- Logging: `MCP_LOG_LEVEL`

## ⚡ Cloudflare Workers Deployment

Deploy the server to Cloudflare Workers for global edge deployment with zero cold starts:

### Prerequisites

1. **Install Wrangler CLI:**
```bash
npm install -g wrangler
```

2. **Authenticate with Cloudflare:**
```bash
wrangler login
```

### Quick Start

**1. Build the project:**
```bash
npm run build
```

**2. Deploy to development:**
```bash
npm run deploy:workers
```

**3. Deploy to staging:**
```bash
npm run deploy:workers:staging
```

**4. Deploy to production:**
```bash
npm run deploy:workers:production
```

### Local Development

Test the Workers adapter locally with Wrangler:

```bash
npm run dev:workers
```

This starts a local server at `http://localhost:8787` with hot reload.

### Configuration

Configure your Workers deployment by editing `wrangler.toml`:

```toml
name = "mcp-senado"
main = "build/workers/index.js"
compatibility_date = "2024-01-01"

[vars]
SENADO_API_BASE_URL = "https://legis.senado.leg.br/dadosabertos/"
WORKERS_CORS_ORIGIN = "*"
MCP_CACHE_ENABLED = "true"
# ... more configuration
```

### Environment-Specific Configuration

The project supports three environments:
- **Development** (default): For local testing with `wrangler dev`
- **Staging**: Pre-production environment at `mcp-senado-staging.workers.dev`
- **Production**: Production environment at `mcp-senado-production.workers.dev`

### Environment Variables

All configuration can be set via environment variables in `wrangler.toml`:

- **API Configuration:**
  - `SENADO_API_BASE_URL`: Brazilian Senate API base URL

- **Workers Configuration:**
  - `WORKERS_CORS_ORIGIN`: CORS allowed origins (default: "*")
  - `WORKERS_AUTH_ENABLED`: Enable API authentication (default: "false")
  - `WORKERS_AUTH_TOKEN`: API authentication token

- **Cache Configuration:**
  - `MCP_CACHE_ENABLED`: Enable in-memory cache (default: "true")
  - `MCP_CACHE_TTL`: Cache TTL in seconds (default: "300")
  - `MCP_CACHE_MAX_SIZE`: Maximum cache entries (default: "1000")

- **Rate Limiting:**
  - `MCP_RATE_LIMIT_ENABLED`: Enable rate limiting (default: "true")
  - `MCP_RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: "30")
  - `MCP_RATE_LIMIT_WINDOW_MS`: Time window in ms (default: "60000")

- **Circuit Breaker:**
  - `MCP_CIRCUIT_BREAKER_ENABLED`: Enable circuit breaker (default: "true")
  - `MCP_CIRCUIT_BREAKER_THRESHOLD`: Failure threshold (default: "5")
  - `MCP_CIRCUIT_BREAKER_TIMEOUT`: Timeout in ms (default: "60000")

- **HTTP Client:**
  - `MCP_HTTP_TIMEOUT`: Request timeout in ms (default: "30000")
  - `MCP_HTTP_RETRY_ATTEMPTS`: Max retry attempts (default: "3")
  - `MCP_HTTP_RETRY_DELAY`: Retry delay in ms (default: "1000")

- **Logging:**
  - `MCP_LOG_LEVEL`: Log level (default: "info")
  - `MCP_LOG_MASK_PII`: Mask personally identifiable information (default: "false")

### API Endpoints

Once deployed, your Workers instance exposes the following REST endpoints:

- `GET /health` - Health check endpoint
- `GET /info` - Server information (version, tool count, etc.)
- `GET /api/tools` - List all available tools
- `GET /api/tools/:name` - Get specific tool details
- `POST /api/tools/:name` - Invoke a tool with parameters
- `GET /api/categories` - List all tool categories
- `GET /api/tools/category/:category` - Get tools by category

### Example Usage

**Invoke a tool via REST API:**
```bash
curl -X POST https://your-worker.workers.dev/api/tools/ufs_listar \
  -H "Content-Type: application/json" \
  -d '{}'
```

**List all tools:**
```bash
curl https://your-worker.workers.dev/api/tools
```

**Get tool by category:**
```bash
curl https://your-worker.workers.dev/api/tools/category/senator
```

### Benefits of Workers Deployment

- **Global Edge Network**: Deployed to 300+ Cloudflare data centers worldwide
- **Zero Cold Starts**: Workers start instantly with no initialization delay
- **Automatic Scaling**: Handles traffic spikes automatically
- **Low Latency**: Responses from the nearest data center to users
- **Cost-Effective**: Free tier includes 100,000 requests/day
- **Built-in DDoS Protection**: Cloudflare's security by default

## 🛠️ Available Tools

### Reference Data (10 tools)
- List legislatures, proposal types, and statuses
- Access Brazilian states and committee types
- List author types, session types, and voting types
- Get document types and subject classifications

### Senators (13 tools)
- List senators with filters (name, party, state, legislature)
- Get detailed senator information and biography
- Access voting history and authored proposals
- View committee memberships and leadership positions
- Search speeches and legislative activities

### Legislative Proposals (12 tools)
- Search proposals with advanced filters
- Get detailed proposal information and full text
- Access voting history and processing status
- View proposal amendments and related documents
- List authors and co-authors

### Voting (5 tools)
- List voting sessions with filters
- Get detailed voting results
- Access individual senator votes by voting session
- View voting statistics and party orientations

### Committees (5 tools)
- List all committees (permanent and temporary)
- Get committee details, members, and composition
- Access meeting schedules and agendas
- View proposals under committee review

### Parties (5 tools)
- List all political parties and parliamentary blocs
- Get party details and current senators
- Access party leadership information
- View bloc compositions and coalitions

### Sessions & Plenary (6 tools)
- List plenary sessions with filters
- Get session details and schedules
- Access session votings and results
- View session speeches and transcripts
- Get plenary results by month

## 📖 Usage Examples

```
"Show me all senators from São Paulo"
"What is the voting record of Senator X?"
"Find all bills about education from 2024"
"What is the current status of PLS 123/2024?"
"List all permanent committees"
"How many senators does each party have?"
```

## ⚙️ Configuration

Create a `.env` file or set environment variables:

```bash
# API Configuration
SENADO_API_BASE_URL=https://legis.senado.leg.br/dadosabertos/

# Cache Configuration
MCP_CACHE_ENABLED=true
MCP_CACHE_TTL=300

# Rate Limiting
MCP_RATE_LIMIT_ENABLED=true
MCP_RATE_LIMIT_MAX_REQUESTS=30
MCP_RATE_LIMIT_WINDOW_MS=60000

# Logging
MCP_LOG_LEVEL=info
```

## 🏗️ Architecture

```
AI Assistants (Claude, Cursor, Windsurf, Continue.dev)
    ↓ MCP Protocol (stdio/HTTP)
Adapters Layer (CLI, HTTP Server, Cloudflare Workers)
    ↓
Core Layer (MCP Server, Tool Registry, Validation)
    ↓
Tools Layer (Senator, Proposal, Voting, Committee, Party, Reference)
    ↓
Infrastructure Layer (HTTP Client, Cache, Circuit Breaker, Rate Limiter)
    ↓ HTTPS
Senado Federal Open Data API
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [mcp-camara](https://github.com/cristianoaredes/mcp-camara) - MCP server for Brazilian Chamber of Deputies
- [mcp-dadosbr](https://github.com/cristianoaredes/mcp-dadosbr) - MCP server for Brazilian public data

## 📚 Documentation

- [Configuration Guide](docs/CONFIGURATION.md)
- [Usage Examples](docs/USAGE_EXAMPLES.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🙏 Acknowledgments

- [Senado Federal](https://www12.senado.leg.br/) for providing the Open Data API
- [Anthropic](https://www.anthropic.com/) for the Model Context Protocol
- Brazilian open data community

## 📧 Contact

**Maintainer**: Cristiano Aredes  
**Email**: cristiano@aredes.me  
**LinkedIn**: [cristianoaredes](https://www.linkedin.com/in/cristianoaredes/)

---

Made with ❤️ for the Brazilian open data community
