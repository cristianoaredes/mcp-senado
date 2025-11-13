# MCP Senado Federal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

MCP (Model Context Protocol) server for the Brazilian Federal Senate (Senado Federal) Open Data API. Enable AI assistants like Claude, Cursor, Windsurf, and Continue.dev to access comprehensive legislative data from the Brazilian Senate.

## 🎯 Features

- **50+ Tools** across 6 categories for comprehensive legislative data access
- **Multi-Platform Support**: NPM package, Cloudflare Workers, and Smithery
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

## 🛠️ Available Tools

### Senators (15+ tools)
- List senators with filters (name, party, state, legislature)
- Get detailed senator information
- Access voting history and authored proposals
- View committee memberships and leadership positions

### Legislative Proposals (10+ tools)
- Search proposals with advanced filters
- Get detailed proposal information
- Access voting history and processing status
- View proposal texts and amendments

### Voting (5+ tools)
- List voting sessions with filters
- Get detailed voting results
- Access individual senator votes
- View party voting orientations

### Committees (5+ tools)
- List all committees
- Get committee details and members
- Access meeting schedules
- View proposals under review

### Parties (5+ tools)
- List all political parties
- Get party details and senators
- Access parliamentary blocs
- View party leadership

### Reference Data (10+ tools)
- List legislatures, proposal types, and statuses
- Access Brazilian states and committee types
- Get classification and reference data

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
