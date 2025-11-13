# MCP Senado Federal - References and Resources

## Overview

This document provides comprehensive references to all resources, repositories, and documentation used in planning the MCP Senado Federal implementation. All reference repositories have been cloned locally for detailed analysis.

## Cloned Reference Repositories

### 1. mcp-server-template

**Location**: `./mcp-server-template/`  
**Repository**: https://github.com/cristianoaredes/mcp-server-template  
**Purpose**: Boilerplate template for building MCP servers in TypeScript

**Key Components to Reference**:
- `lib/core/mcp-server.ts` - Core server implementation pattern
- `lib/core/tools.ts` - Tool registry and definition interfaces
- `lib/core/validation.ts` - Zod schema validation patterns
- `lib/adapters/cli.ts` - Stdio transport adapter
- `lib/infrastructure/` - Cache, rate limiter, logger implementations
- `lib/workers/worker.ts` - Cloudflare Workers adapter
- `scripts/create-tool.ts` - Tool scaffolding script
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `wrangler.toml` - Cloudflare Workers configuration
- `smithery.yaml` - Smithery deployment configuration

**Key Learnings**:
- Project structure and organization
- Build and deployment scripts
- Testing setup with Vitest
- Development workflow optimization
- Tool scaffolding automation

### 2. mcp-camara

**Location**: `./mcp-camara/`  
**Repository**: https://github.com/cristianoaredes/mcp-camara  
**Purpose**: MCP server for Brazilian Chamber of Deputies (Câmara dos Deputados)

**Key Components to Reference**:
- `lib/core/mcp-server.ts` - Production-ready MCP server implementation
- `lib/core/http-client.ts` - HTTP client with retries and error handling
- `lib/core/cache.ts` - LRU cache implementation
- `lib/core/tools.ts` - Tool registry and context pattern
- `lib/core/validation.ts` - Comprehensive Zod schemas
- `lib/tools/deputy-tools.ts` - Example of 15 related tools in one file
- `lib/tools/proposition-tools.ts` - Complex data model handling
- `lib/tools/voting-tools.ts` - Voting data parsing patterns
- `lib/tools/committee-tools.ts` - Committee data structures
- `lib/tools/party-tools.ts` - Party and bloc data handling
- `lib/tools/reference-tools.ts` - Reference data tools
- `lib/infrastructure/rate-limiter.ts` - Token bucket rate limiter
- `lib/workers/worker.ts` - Cloudflare Workers with KV storage
- `lib/workers/kv-cache.ts` - KV-based caching
- `lib/workers/kv-rate-limiter.ts` - KV-based rate limiting
- `lib/workers/openapi-spec.ts` - OpenAPI specification generation
- `lib/workers/sse.ts` - Server-Sent Events implementation
- `README.md` - Comprehensive documentation structure

**Key Learnings**:
- Proven architecture for Brazilian legislative data
- Effective tool organization by category (62 tools total)
- Multi-platform deployment (NPM, Cloudflare, Smithery)
- Portuguese and English documentation
- Integration patterns with AI assistants
- Error handling for legislative APIs
- Data model patterns for Brazilian Congress

**Similarities to Senado Implementation**:
- Both are Brazilian legislative bodies
- Similar data structures (legislators, proposals, voting, committees)
- Same deployment targets (NPM, Cloudflare, Smithery)
- Same AI assistant integrations
- Similar tool categories and organization

**Differences to Consider**:
- Camara API returns JSON, Senado returns XML
- Different endpoint structures and naming
- Camara uses `id`, Senado uses `codigo`
- Different pagination schemes
- Different data field names

### 3. mcp-dadosbr

**Location**: `./mcp-dadosbr/`  
**Repository**: https://github.com/cristianoaredes/mcp-dadosbr  
**Purpose**: MCP server for Brazilian public data (CNPJ companies, CEP postal codes)

**Key Components to Reference**:
- `lib/infrastructure/circuit-breaker.ts` - Circuit breaker implementation
- `lib/infrastructure/cache.ts` - Advanced caching strategies
- `lib/core/validation.ts` - Input sanitization patterns
- `lib/workers/worker.ts` - Production Cloudflare Workers setup
- `lib/tools/` - Tool implementation patterns
- `docs/` - Comprehensive documentation structure
- `docs/CONFIGURATION.md` - Configuration documentation
- `docs/USAGE_EXAMPLES.md` - Usage examples and prompts
- `docs/CLOUDFLARE_DEPLOYMENT.md` - Deployment guide
- `docs/TROUBLESHOOTING.md` - Troubleshooting guide
- `docs/PROVIDERS.md` - Provider comparison
- `docs/development/AGENTS.md` - Agent development guide

**Key Learnings**:
- Circuit breaker pattern for resilience
- Advanced error handling strategies
- Security patterns (API key auth, PII masking)
- Performance optimization techniques
- Comprehensive documentation structure
- LGPD compliance patterns
- Multiple search provider integration
- Sequential thinking tool pattern

**Reusable Patterns**:
- Circuit breaker for API failure protection
- PII masking in logs
- API key authentication for REST endpoints
- Rate limiting with KV storage
- Health check endpoint implementation
- Monitoring and observability patterns

## Senado Federal API Documentation

### Official Documentation

**Primary Documentation**:
- **Swagger UI**: https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
  - Interactive API documentation
  - Endpoint testing interface
  - Request/response examples
  - Schema definitions

- **API v3 Documentation**: https://legis.senado.leg.br/dadosabertos/v3/api-docs
  - OpenAPI/Swagger specification
  - Complete endpoint reference
  - Data model definitions

- **General Information**: https://www12.senado.leg.br/dados-abertos
  - Overview of available data
  - Usage guidelines
  - Terms of service
  - Contact information

- **About Page**: https://www12.senado.leg.br/dados-abertos/sobre
  - Background on open data initiative
  - Data update frequency
  - Data quality information
  - Support resources

### API Characteristics

**Base URL**: `https://legis.senado.leg.br/dadosabertos/`

**Response Format**: 
- Default: XML
- JSON support: May require Accept headers or format parameters
- Need to implement XML to JSON parser

**Authentication**: 
- No authentication required for public endpoints
- Rate limiting may be enforced server-side

**Data Coverage**:
- Current legislature (57th, 2023-2027)
- Historical data from previous legislatures
- Real-time updates for voting and proposals
- Comprehensive senator information

## Model Context Protocol (MCP) Resources

### Official MCP Documentation

**MCP Specification**: https://modelcontextprotocol.io/
- Protocol specification
- Message formats
- Transport mechanisms
- Best practices

**MCP SDK**: https://github.com/modelcontextprotocol/sdk
- TypeScript/JavaScript SDK
- Server and client implementations
- Example implementations
- API reference

**Anthropic Announcement**: https://www.anthropic.com/news/model-context-protocol
- Background on MCP
- Use cases and benefits
- Integration examples

### MCP Implementation Patterns

**Transport Mechanisms**:
1. **Stdio**: Standard input/output for local execution
   - Used by Claude Desktop, Cursor, Windsurf
   - No network exposure
   - Simple configuration

2. **HTTP**: HTTP server with JSON-RPC 2.0
   - Used for remote servers
   - REST API endpoints
   - SSE for streaming

3. **SSE**: Server-Sent Events
   - Real-time updates
   - Long-lived connections
   - Event streaming

**Tool Definition Pattern**:
```typescript
interface ToolDefinition {
  name: string;                    // Unique tool identifier
  description: string;             // Human-readable description
  inputSchema: ZodSchema;          // Zod validation schema
  handler: ToolHandler;            // Implementation function
  category?: string;               // Optional categorization
}
```

**Tool Context Pattern**:
```typescript
interface ToolContext {
  httpClient: HttpClient;          // API client
  cache: CacheInterface;           // Caching layer
  config: ServerConfig;            // Configuration
  logger: Logger;                  // Logging
}
```

## Technology Stack Documentation

### TypeScript

**Official Documentation**: https://www.typescriptlang.org/
- Language reference
- Compiler options
- Type system
- Best practices

**Configuration for Project**:
- Strict mode enabled
- ES modules
- Node.js 18+ target
- Source maps for debugging

### Zod

**Official Documentation**: https://zod.dev/
- Schema validation
- Type inference
- Error handling
- Transformations

**Usage in Project**:
- Input validation for all tools
- Type-safe API responses
- Error message generation
- JSON Schema conversion

### Express

**Official Documentation**: https://expressjs.com/
- Routing
- Middleware
- Request/response handling
- Error handling

**Usage in Project**:
- HTTP adapter implementation
- REST API endpoints
- CORS configuration
- Health check endpoint

### Cloudflare Workers

**Official Documentation**: https://developers.cloudflare.com/workers/
- Workers runtime
- KV storage
- Deployment
- Best practices

**Usage in Project**:
- Serverless deployment
- Global edge distribution
- KV-based caching
- KV-based rate limiting

### Vitest

**Official Documentation**: https://vitest.dev/
- Test framework
- Assertions
- Mocking
- Coverage

**Usage in Project**:
- Unit tests
- Integration tests
- E2e tests
- Coverage reporting

## AI Assistant Integration

### Claude Desktop

**Configuration Location**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

**Configuration Format**:
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

### Cursor IDE

**Configuration Location**: `~/.cursor/config.json`

**Configuration Format**: Same as Claude Desktop

### Windsurf IDE

**Configuration Location**: `~/.windsurf/config.json`

**Configuration Format**: Same as Claude Desktop

### Continue.dev

**Configuration Location**: `~/.continue/config.json`

**Configuration Format**:
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

## Development Tools and Libraries

### Core Dependencies

**@modelcontextprotocol/sdk** (^1.0.4)
- MCP protocol implementation
- Server and client classes
- Transport adapters
- Type definitions

**express** (^5.0.0)
- HTTP server framework
- Middleware support
- Routing
- Request/response handling

**zod** (^3.23.8)
- Schema validation
- Type inference
- Error handling
- JSON Schema conversion

**dotenv** (^16.4.5)
- Environment variable loading
- Configuration management
- .env file support

### Development Dependencies

**typescript** (^5.7.0)
- TypeScript compiler
- Type checking
- ES module support

**tsx** (^4.0.0)
- TypeScript execution
- Development server
- Fast compilation

**vitest** (^4.0.0)
- Test framework
- Coverage reporting
- Fast execution

**wrangler** (^4.0.0)
- Cloudflare Workers CLI
- Local development
- Deployment
- KV management

## Project Structure Reference

### Recommended Directory Structure

```
mcp-senado/
├── .kiro/
│   └── specs/
│       └── senado-mcp/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── docs/
│   ├── plan/
│   │   ├── senado-mcp-implementation-plan.md
│   │   └── references-and-resources.md
│   ├── CONFIGURATION.md
│   ├── USAGE_EXAMPLES.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── ARCHITECTURE.md
│   └── CONTRIBUTING.md
├── lib/
│   ├── adapters/
│   │   ├── cli.ts
│   │   ├── http.ts
│   │   └── index.ts
│   ├── bin/
│   │   └── mcp-senado.ts
│   ├── config/
│   │   └── index.ts
│   ├── core/
│   │   ├── mcp-server.ts
│   │   ├── tools.ts
│   │   ├── validation.ts
│   │   └── errors.ts
│   ├── infrastructure/
│   │   ├── http-client.ts
│   │   ├── cache.ts
│   │   ├── circuit-breaker.ts
│   │   ├── rate-limiter.ts
│   │   └── logger.ts
│   ├── tools/
│   │   ├── senator-tools.ts
│   │   ├── proposal-tools.ts
│   │   ├── voting-tools.ts
│   │   ├── committee-tools.ts
│   │   ├── party-tools.ts
│   │   ├── reference-tools.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── workers/
│   │   ├── worker.ts
│   │   ├── kv-cache.ts
│   │   ├── kv-rate-limiter.ts
│   │   └── openapi-spec.ts
│   └── index.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   └── create-tool.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── wrangler.toml
├── smithery.yaml
├── README.md
└── LICENSE
```

## Implementation Checklist

### Pre-Implementation
- [x] Clone reference repositories
- [x] Review Senado API documentation
- [x] Create requirements document
- [x] Create design document
- [x] Create implementation tasks
- [x] Create comprehensive plan document
- [ ] Review and approve all planning documents
- [ ] Set up GitHub repository

### Phase 1: Foundation
- [ ] Initialize TypeScript project
- [ ] Set up dependencies
- [ ] Create directory structure
- [ ] Implement HTTP client
- [ ] Implement cache layer
- [ ] Implement circuit breaker
- [ ] Implement rate limiter
- [ ] Implement logger
- [ ] Implement tool registry
- [ ] Implement MCP server core
- [ ] Implement validation framework
- [ ] Implement error handling

### Phase 2: Tools
- [ ] Implement senator tools (15+)
- [ ] Implement proposal tools (10+)
- [ ] Implement voting tools (5+)
- [ ] Implement committee tools (5+)
- [ ] Implement party tools (5+)
- [ ] Implement reference tools (10+)

### Phase 3: Adapters
- [ ] Implement CLI adapter (stdio)
- [ ] Implement HTTP adapter (Express)
- [ ] Implement Cloudflare Workers adapter
- [ ] Implement security features

### Phase 4: Testing
- [ ] Write unit tests (70%+ coverage)
- [ ] Write integration tests
- [ ] Write e2e tests
- [ ] Performance testing

### Phase 5: Documentation
- [ ] Write README
- [ ] Write API documentation
- [ ] Write configuration documentation
- [ ] Write deployment guides
- [ ] Write usage examples
- [ ] Write developer documentation

### Phase 6: Deployment
- [ ] Publish to NPM
- [ ] Deploy to Cloudflare Workers
- [ ] Submit to Smithery
- [ ] Set up CI/CD
- [ ] Configure monitoring

## Additional Resources

### Brazilian Legislative System
- **Senado Federal**: https://www12.senado.leg.br/
- **Câmara dos Deputados**: https://www.camara.leg.br/
- **Congresso Nacional**: https://www.congressonacional.leg.br/

### Open Data Initiatives
- **Portal Brasileiro de Dados Abertos**: https://dados.gov.br/
- **LGPD**: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd

### Community and Support
- **MCP Community**: https://github.com/modelcontextprotocol
- **Anthropic Discord**: https://discord.gg/anthropic
- **Brazilian Dev Community**: Various forums and groups

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Reference Document - Complete
