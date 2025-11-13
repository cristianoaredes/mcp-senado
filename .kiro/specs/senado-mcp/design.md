# Design Document - MCP Senado Federal

## Overview

This document describes the technical design for the MCP Senado Federal server, which provides AI assistants with access to Brazilian Federal Senate legislative data through the Model Context Protocol. The design follows proven architectural patterns from the mcp-camara and mcp-dadosbr projects while adapting to the specific requirements of the Senado API.

### Key Design Principles

1. **Consistency**: Follow the same architectural patterns as mcp-camara for maintainability
2. **Modularity**: Separate concerns into distinct layers (adapters, core, infrastructure, tools)
3. **Testability**: Use dependency injection and interfaces for easy testing
4. **Resilience**: Implement circuit breakers, retries, and graceful degradation
5. **Performance**: Use caching and rate limiting to optimize API usage
6. **Multi-platform**: Support stdio, HTTP, and Cloudflare Workers deployment

### Technology Stack

- **Language**: TypeScript 5.7+ (strict mode)
- **Runtime**: Node.js 18+
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **HTTP Server**: Express 5.x
- **Validation**: Zod 3.23+
- **Testing**: Vitest
- **Deployment**: NPM, Cloudflare Workers, Smithery

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Assistants                          │
│  (Claude Desktop, Cursor, Windsurf, Continue.dev)          │
└────────────────────┬────────────────────────────────────────┘
                     │ MCP Protocol (stdio/HTTP)
┌────────────────────▼────────────────────────────────────────┐
│                   Adapters Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐     │
│  │   CLI    │  │   HTTP   │  │  Cloudflare Workers  │     │
│  │ (stdio)  │  │  Server  │  │      (Edge)          │     │
│  └──────────┘  └──────────┘  └──────────────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Core Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  MCP Server  │  │ Tool Registry│  │  Validation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Tools Layer                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Senator  │ │Proposals │ │ Voting   │ │Committee │      │
│  │  Tools   │ │  Tools   │ │  Tools   │ │  Tools   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐                                 │
│  │  Party   │ │Reference │                                 │
│  │  Tools   │ │  Tools   │                                 │
│  └──────────┘ └──────────┘                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Infrastructure Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  HTTP    │ │  Cache   │ │ Circuit  │ │   Rate   │      │
│  │  Client  │ │  Layer   │ │ Breaker  │ │ Limiter  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────┐
│           Senado Federal Open Data API                      │
│      https://legis.senado.leg.br/dadosabertos/             │
└─────────────────────────────────────────────────────────────┘
```


### Layer Responsibilities

#### 1. Adapters Layer
- **CLI Adapter** (`lib/adapters/cli.ts`): Stdio transport for desktop AI assistants
- **HTTP Adapter** (`lib/adapters/http.ts`): Express server with REST endpoints and SSE
- **Workers Adapter** (`lib/workers/worker.ts`): Cloudflare Workers edge deployment

#### 2. Core Layer
- **MCP Server** (`lib/core/mcp-server.ts`): Main server class, protocol handlers
- **Tool Registry** (`lib/core/tools.ts`): Tool registration and invocation
- **Validation** (`lib/core/validation.ts`): Zod schemas and input validation

#### 3. Tools Layer
- **Senator Tools** (`lib/tools/senator-tools.ts`): 15+ tools for senator data
- **Proposal Tools** (`lib/tools/proposal-tools.ts`): 10+ tools for legislative proposals
- **Voting Tools** (`lib/tools/voting-tools.ts`): 5+ tools for voting records
- **Committee Tools** (`lib/tools/committee-tools.ts`): 5+ tools for committee data
- **Party Tools** (`lib/tools/party-tools.ts`): 5+ tools for party information
- **Reference Tools** (`lib/tools/reference-tools.ts`): 10+ tools for reference data

#### 4. Infrastructure Layer
- **HTTP Client** (`lib/infrastructure/http-client.ts`): Senado API client with retries
- **Cache** (`lib/infrastructure/cache.ts`): LRU cache with TTL
- **Circuit Breaker** (`lib/infrastructure/circuit-breaker.ts`): Failure protection
- **Rate Limiter** (`lib/infrastructure/rate-limiter.ts`): Request throttling
- **Logger** (`lib/infrastructure/logger.ts`): Structured logging

## Components and Interfaces

### Core Interfaces

```typescript
// Tool Definition Interface
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler: (args: unknown, context: ToolContext) => Promise<ToolResult>;
  category: string;
}

// Tool Context Interface
interface ToolContext {
  httpClient: SenadoHttpClient;
  cache: CacheInterface;
  config: MCPServerConfig;
  logger: Logger;
}

// Tool Result Interface
interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// Cache Interface
interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  generateKey(prefix: string, params: Record<string, unknown>): string;
}

// HTTP Client Interface
interface SenadoHttpClient {
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>>;
}

// Configuration Interface
interface MCPServerConfig {
  name: string;
  version: string;
  transport: 'stdio' | 'http';
  apiBaseUrl: string;
  httpPort: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  cacheMaxSize: number;
  rateLimitEnabled: boolean;
  rateLimitTokens: number;
  rateLimitInterval: number;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}
```


### Senado API Integration

#### API Base URL
```
https://legis.senado.leg.br/dadosabertos/
```

#### API Documentation References
- Swagger UI: https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
- API v3 Docs: https://legis.senado.leg.br/dadosabertos/v3/api-docs
- General Info: https://www12.senado.leg.br/dados-abertos
- About: https://www12.senado.leg.br/dados-abertos/sobre

#### Key API Endpoints (Based on Swagger Documentation)

**Senators (Senadores)**
- `GET /senador/lista/{legislatura}` - List senators by legislature
- `GET /senador/{codigo}` - Get senator details
- `GET /senador/{codigo}/autorias` - Get authored proposals
- `GET /senador/{codigo}/votacoes` - Get voting history
- `GET /senador/{codigo}/comissoes` - Get committee memberships
- `GET /senador/{codigo}/licencas` - Get leave records
- `GET /senador/{codigo}/mandatos` - Get mandate history

**Legislative Proposals (Matérias)**
- `GET /materia/pesquisa/lista` - Search proposals
- `GET /materia/{codigo}` - Get proposal details
- `GET /materia/{codigo}/votacoes` - Get proposal voting history
- `GET /materia/{codigo}/tramitacoes` - Get processing history
- `GET /materia/{codigo}/textos` - Get proposal texts
- `GET /materia/{codigo}/autores` - Get proposal authors
- `GET /materia/{codigo}/relacionadas` - Get related proposals

**Voting (Votações)**
- `GET /votacao/lista/{data}` - List votes by date
- `GET /votacao/{codigo}` - Get voting details
- `GET /votacao/{codigo}/votos` - Get individual votes

**Committees (Comissões)**
- `GET /comissao/lista` - List all committees
- `GET /comissao/{codigo}` - Get committee details
- `GET /comissao/{codigo}/membros` - Get committee members
- `GET /comissao/{codigo}/reunioes` - Get committee meetings
- `GET /comissao/{codigo}/materias` - Get proposals under review

**Parties (Partidos)**
- `GET /partido/lista` - List all parties
- `GET /partido/{codigo}` - Get party details
- `GET /partido/{codigo}/senadores` - Get party senators
- `GET /bloco/lista` - List parliamentary blocs
- `GET /bloco/{codigo}` - Get bloc details

**Reference Data**
- `GET /legislatura/lista` - List all legislatures
- `GET /legislatura/{numero}` - Get legislature details
- `GET /tipoMateria/lista` - List proposal types
- `GET /situacaoMateria/lista` - List proposal statuses
- `GET /uf/lista` - List Brazilian states

#### API Response Format
The Senado API returns XML by default. We'll need to:
1. Request JSON format using Accept headers or format parameters
2. Parse XML responses if JSON is not available
3. Transform responses to consistent JSON structure

#### Rate Limiting Strategy
- Implement client-side rate limiting (30 req/min default)
- Add exponential backoff for 429 responses
- Cache responses aggressively (5-minute TTL default)


## Data Models

### Senator Data Model
```typescript
interface Senator {
  codigo: number;
  nome: string;
  nomeCompleto: string;
  sexo: 'M' | 'F';
  dataNascimento: string;
  uf: string;
  partido: {
    codigo: number;
    sigla: string;
    nome: string;
  };
  situacao: string;
  email?: string;
  telefone?: string;
  urlFoto?: string;
  urlPagina?: string;
}

interface SenatorVote {
  codigoVotacao: number;
  dataVotacao: string;
  descricaoVotacao: string;
  voto: 'SIM' | 'NÃO' | 'ABSTENÇÃO' | 'OBSTRUÇÃO';
  materia?: {
    codigo: number;
    sigla: string;
    numero: number;
    ano: number;
  };
}
```

### Proposal Data Model
```typescript
interface Proposal {
  codigo: number;
  sigla: string;
  numero: number;
  ano: number;
  ementa: string;
  explicacao?: string;
  dataApresentacao: string;
  situacao: {
    codigo: number;
    descricao: string;
  };
  autores: Array<{
    codigo: number;
    nome: string;
    tipo: 'SENADOR' | 'COMISSAO';
  }>;
  tipo: {
    codigo: number;
    sigla: string;
    descricao: string;
  };
}

interface ProposalProcessing {
  sequencia: number;
  data: string;
  situacao: string;
  origem: string;
  destino?: string;
  texto?: string;
}
```

### Voting Data Model
```typescript
interface Voting {
  codigo: number;
  data: string;
  hora: string;
  descricao: string;
  resultado: 'APROVADO' | 'REJEITADO' | 'RETIRADO';
  tipoVotacao: 'NOMINAL' | 'SIMBÓLICA' | 'SECRETA';
  materia?: {
    codigo: number;
    sigla: string;
    numero: number;
    ano: number;
  };
  totalSim: number;
  totalNao: number;
  totalAbstencao: number;
  totalObstrucao: number;
}

interface Vote {
  senador: {
    codigo: number;
    nome: string;
    partido: string;
    uf: string;
  };
  voto: 'SIM' | 'NÃO' | 'ABSTENÇÃO' | 'OBSTRUÇÃO' | 'AUSENTE';
}
```

### Committee Data Model
```typescript
interface Committee {
  codigo: number;
  sigla: string;
  nome: string;
  tipo: 'PERMANENTE' | 'TEMPORÁRIA' | 'MISTA';
  finalidade?: string;
  dataInicio?: string;
  dataFim?: string;
  situacao: 'ATIVA' | 'INATIVA';
}

interface CommitteeMember {
  senador: {
    codigo: number;
    nome: string;
    partido: string;
    uf: string;
  };
  cargo: 'PRESIDENTE' | 'VICE-PRESIDENTE' | 'TITULAR' | 'SUPLENTE';
  dataInicio: string;
  dataFim?: string;
}
```

### Party Data Model
```typescript
interface Party {
  codigo: number;
  sigla: string;
  nome: string;
  dataFundacao?: string;
  situacao: 'ATIVO' | 'INATIVO';
  lider?: {
    codigo: number;
    nome: string;
  };
  totalSenadores: number;
}

interface ParliamentaryBloc {
  codigo: number;
  nome: string;
  sigla: string;
  dataInicio: string;
  dataFim?: string;
  partidos: Array<{
    codigo: number;
    sigla: string;
    nome: string;
  }>;
}
```


## Error Handling

### Error Types

```typescript
// Base error class
class SenadoAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SenadoAPIError';
  }
}

// Validation error
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Rate limit error
class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Circuit breaker error
class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}
```

### Error Handling Strategy

1. **API Errors**: Catch HTTP errors and transform to SenadoAPIError
2. **Validation Errors**: Validate inputs with Zod and throw ValidationError
3. **Rate Limit Errors**: Detect 429 responses and throw RateLimitError
4. **Circuit Breaker**: Open circuit after 5 consecutive failures
5. **Timeout Errors**: Set 30-second timeout for all API requests
6. **Retry Logic**: Retry failed requests up to 3 times with exponential backoff

### Error Response Format

All errors are returned as MCP tool results:

```typescript
{
  content: [{
    type: 'text',
    text: 'Error: [Error Type] - [Error Message]\nDetails: [Additional Context]'
  }],
  isError: true
}
```

## Testing Strategy

### Unit Tests (70% coverage minimum)

**Core Components**
- `mcp-server.test.ts`: Server initialization, tool registration, request handling
- `tools.test.ts`: Tool registry, tool invocation, context creation
- `validation.test.ts`: Zod schema validation, input sanitization

**Infrastructure Components**
- `http-client.test.ts`: API requests, retries, error handling
- `cache.test.ts`: Cache operations, TTL, eviction
- `circuit-breaker.test.ts`: Circuit states, failure detection
- `rate-limiter.test.ts`: Token bucket, rate limiting

**Tool Implementations**
- `senator-tools.test.ts`: All senator tool handlers
- `proposal-tools.test.ts`: All proposal tool handlers
- `voting-tools.test.ts`: All voting tool handlers
- `committee-tools.test.ts`: All committee tool handlers
- `party-tools.test.ts`: All party tool handlers
- `reference-tools.test.ts`: All reference tool handlers

### Integration Tests

**API Integration**
- `senado-api.integration.test.ts`: Real API calls to verify endpoints
- `error-handling.integration.test.ts`: Error scenarios and recovery

**End-to-End Tests**
- `mcp-protocol.e2e.test.ts`: Full MCP protocol flow
- `tool-invocation.e2e.test.ts`: Tool invocation from client perspective

### Test Utilities

```typescript
// Mock HTTP client for testing
class MockSenadoHttpClient implements SenadoHttpClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return { data: mockData as T, status: 200 };
  }
}

// Mock cache for testing
class MockCache implements CacheInterface {
  private store = new Map<string, unknown>();
  
  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) || null;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
}
```


## Deployment Architecture

### NPM Package Deployment

**Package Structure**
```
@aredes.me/mcp-senado/
├── build/
│   └── lib/
│       ├── bin/mcp-senado.js
│       ├── adapters/
│       ├── core/
│       ├── infrastructure/
│       └── tools/
├── README.md
├── LICENSE
└── package.json
```

**Installation**
```bash
npm install -g @aredes.me/mcp-senado
# or
npx @aredes.me/mcp-senado
```

**Configuration Files**
- `.env` - Environment variables
- `.mcprc.json` - Optional JSON configuration
- `claude_desktop_config.json` - Claude Desktop integration
- `settings.json` - Cursor/Windsurf integration

### Cloudflare Workers Deployment

**Worker Architecture**
```typescript
// lib/workers/worker.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle MCP protocol requests
    if (request.url.endsWith('/mcp')) {
      return handleMCPRequest(request, env);
    }
    
    // Handle REST API requests
    if (request.url.includes('/senadores/')) {
      return handleRESTRequest(request, env);
    }
    
    // Health check
    if (request.url.endsWith('/health')) {
      return new Response('OK', { status: 200 });
    }
    
    return new Response('Not Found', { status: 404 });
  }
}
```

**KV Storage**
- `MCP_CACHE` - Response caching
- `RATE_LIMIT_KV` - Rate limiting state

**Environment Variables**
```bash
wrangler secret put MCP_API_KEY
wrangler secret put SENADO_API_BASE_URL
```

**Deployment Commands**
```bash
npm run build
npm run workers:deploy:dev    # Development
npm run workers:deploy:prod   # Production
```

### Smithery Deployment

**smithery.yaml**
```yaml
name: mcp-senado
version: 1.0.0
description: MCP server for Brazilian Federal Senate Open Data API
author: Cristiano Aredes
license: MIT

install:
  npm: "@aredes.me/mcp-senado"
  
config:
  env:
    - name: SENADO_API_BASE_URL
      description: Base URL for Senado API
      default: https://legis.senado.leg.br/dadosabertos/
    - name: MCP_CACHE_ENABLED
      description: Enable response caching
      default: "true"
    - name: MCP_CACHE_TTL_SECONDS
      description: Cache TTL in seconds
      default: "300"

clients:
  - claude
  - cursor
  - windsurf
  - continue
```

## Performance Optimization

### Caching Strategy

**Cache Layers**
1. **In-Memory Cache** (Node.js): LRU cache with 5-minute TTL
2. **KV Cache** (Cloudflare): Distributed cache with configurable TTL
3. **HTTP Cache Headers**: Respect Cache-Control from Senado API

**Cache Keys**
```typescript
// Format: tool:name:param1:param2:...
const cacheKey = cache.generateKey('tool:senadores_listar', {
  legislatura: 57,
  partido: 'PT',
  uf: 'SP'
});
// Result: "tool:senadores_listar:legislatura=57:partido=PT:uf=SP"
```

**Cache Invalidation**
- Time-based: Automatic expiration after TTL
- Manual: Clear cache via admin endpoint (if enabled)
- Selective: Invalidate specific keys on data updates

### Rate Limiting

**Token Bucket Algorithm**
```typescript
interface RateLimiter {
  tokens: number;           // Current tokens
  maxTokens: number;        // Maximum tokens (30)
  refillRate: number;       // Tokens per interval (30/min)
  lastRefill: number;       // Last refill timestamp
}
```

**Rate Limit Headers**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1699564800
```

### Circuit Breaker

**States**
- **Closed**: Normal operation, requests pass through
- **Open**: Too many failures, requests fail fast
- **Half-Open**: Testing if service recovered

**Configuration**
```typescript
{
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 60000,           // Try half-open after 60s
  resetTimeout: 300000      // Full reset after 5 minutes
}
```

## Security Considerations

### Authentication

**API Key Authentication** (REST endpoints only)
```typescript
// Validate API key from headers
const apiKey = request.headers.get('X-API-Key') 
  || request.headers.get('Authorization')?.replace('Bearer ', '');

if (apiKey !== env.MCP_API_KEY) {
  return new Response('Unauthorized', { status: 401 });
}
```

**MCP Protocol** (No authentication required)
- Stdio transport: Runs locally, no network exposure
- SSE transport: Protected by same-origin policy

### Input Validation

**Zod Schemas**
```typescript
const SenadorListarSchema = z.object({
  legislatura: z.number().int().positive().optional(),
  nome: z.string().max(100).optional(),
  partido: z.string().max(20).optional(),
  uf: z.string().length(2).optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional(),
});
```

**Sanitization**
- Remove special characters from string inputs
- Validate numeric ranges
- Escape HTML/XML in outputs
- Limit string lengths

### Data Privacy

**PII Masking in Logs**
```typescript
logger.info('Tool invocation', {
  tool: 'senadores_listar',
  args: maskPII({
    nome: 'João Silva',
    email: 'joao@example.com'
  })
});
// Output: { nome: 'J***o S***a', email: 'j***@e***.com' }
```

**LGPD Compliance**
- No storage of personal data
- Logs retention: 30 days maximum
- No tracking or analytics on user queries

### CORS Configuration

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Access-Control-Max-Age': '86400',
};
```

## Monitoring and Observability

### Logging

**Log Levels**
- `DEBUG`: Detailed debugging information
- `INFO`: General informational messages
- `WARN`: Warning messages for potential issues
- `ERROR`: Error messages for failures

**Structured Logging**
```typescript
logger.info('API request', {
  endpoint: '/senadores/123',
  method: 'GET',
  duration: 245,
  status: 200,
  cached: false,
  requestId: 'req_abc123'
});
```

### Metrics

**Key Metrics**
- Request count by tool
- Response time percentiles (p50, p95, p99)
- Cache hit rate
- Error rate by type
- Rate limit violations
- Circuit breaker state changes

**Health Check Endpoint**
```typescript
GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "cache": {
    "enabled": true,
    "hitRate": 0.75,
    "size": 150
  },
  "rateLimit": {
    "enabled": true,
    "violations": 5
  },
  "circuitBreaker": {
    "state": "closed",
    "failures": 0
  }
}
```

### Alerting

**Alert Conditions**
- Error rate > 5% for 5 minutes
- Response time p95 > 2 seconds
- Circuit breaker opens
- Cache hit rate < 50%
- Rate limit violations > 100/hour

## Documentation Structure

### User Documentation

**README.md**
- Quick start guide
- Installation instructions for all IDEs
- Configuration examples
- Available tools reference
- Troubleshooting guide

**docs/CONFIGURATION.md**
- Environment variables reference
- Configuration file format
- Advanced configuration options

**docs/USAGE_EXAMPLES.md**
- Common use cases
- Example prompts
- Integration patterns

**docs/API.md**
- Complete tool reference
- Input/output schemas
- Error codes

### Developer Documentation

**docs/ARCHITECTURE.md**
- System architecture
- Component diagrams
- Design patterns

**docs/CONTRIBUTING.md**
- Development setup
- Code style guide
- Testing guidelines
- Pull request process

**docs/DEPLOYMENT.md**
- NPM deployment
- Cloudflare Workers deployment
- Smithery deployment
- Environment setup

## Migration from Camara Pattern

### Key Differences

**API Format**
- Camara: JSON responses
- Senado: XML responses (need parser)

**Endpoint Structure**
- Camara: `/deputados/{id}`
- Senado: `/senador/{codigo}`

**Data Models**
- Camara: Uses `id` for identifiers
- Senado: Uses `codigo` for identifiers

**Pagination**
- Camara: `pagina` and `itens` parameters
- Senado: May use different pagination scheme

### Reusable Components

**From mcp-camara**
- Core MCP server architecture
- Tool registry pattern
- HTTP client with retries
- Cache layer implementation
- Rate limiter implementation
- Logger implementation
- Error handling patterns
- Test utilities

**Adaptations Needed**
- XML to JSON parser for Senado API
- Different validation schemas
- Senado-specific data models
- Updated tool implementations
- Senado API endpoint mappings

## References

### Senado API Documentation
- **Swagger UI**: https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
- **API v3 Docs**: https://legis.senado.leg.br/dadosabertos/v3/api-docs
- **General Info**: https://www12.senado.leg.br/dados-abertos
- **About**: https://www12.senado.leg.br/dados-abertos/sobre

### Reference Implementations
- **mcp-camara**: https://github.com/cristianoaredes/mcp-camara
- **mcp-dadosbr**: https://github.com/cristianoaredes/mcp-dadosbr
- **mcp-server-template**: https://github.com/cristianoaredes/mcp-server-template

### MCP Protocol
- **MCP Specification**: https://modelcontextprotocol.io/
- **MCP SDK**: https://github.com/modelcontextprotocol/sdk
- **Anthropic Announcement**: https://www.anthropic.com/news/model-context-protocol

### Technology Documentation
- **TypeScript**: https://www.typescriptlang.org/
- **Zod**: https://zod.dev/
- **Express**: https://expressjs.com/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Vitest**: https://vitest.dev/
