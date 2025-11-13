# MCP Senado Federal - Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for building an MCP (Model Context Protocol) server that integrates with the Brazilian Federal Senate (Senado Federal) Open Data API. The project will enable AI assistants like Claude Desktop, Cursor, Windsurf, and Continue.dev to access legislative data from the Brazilian Senate.

**Project Name**: MCP Senado Federal  
**Repository**: To be created at `@aredes.me/mcp-senado`  
**Status**: Planning Phase  
**Target Completion**: TBD (to be implemented after planning approval)

## Project Overview

### Objectives

1. Create a production-ready MCP server for Senado Federal Open Data API
2. Provide 50+ tools for querying senators, proposals, voting, committees, and parties
3. Support multiple deployment platforms (NPM, Cloudflare Workers, Smithery)
4. Follow proven architectural patterns from mcp-camara and mcp-dadosbr
5. Ensure high performance, reliability, and security

### Key Features

- **Comprehensive Data Access**: 50+ tools across 6 categories
- **Multi-Platform Support**: stdio, HTTP, and Cloudflare Workers deployment
- **Production-Ready**: Circuit breaker, rate limiting, caching, monitoring
- **Type-Safe**: Full TypeScript with strict mode
- **Well-Tested**: Unit, integration, and e2e tests
- **Well-Documented**: Complete documentation in Portuguese and English
- **Secure**: API key authentication, input validation, PII masking

## Architecture Overview

### System Architecture

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

### Technology Stack

- **Language**: TypeScript 5.7+ (strict mode)
- **Runtime**: Node.js 18+
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **HTTP Server**: Express 5.x
- **Validation**: Zod 3.23+
- **Testing**: Vitest
- **Deployment**: NPM, Cloudflare Workers, Smithery

## API Integration

### Senado Federal Open Data API

**Base URL**: `https://legis.senado.leg.br/dadosabertos/`

**Documentation References**:
- Swagger UI: https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
- API v3 Docs: https://legis.senado.leg.br/dadosabertos/v3/api-docs
- General Info: https://www12.senado.leg.br/dados-abertos
- About: https://www12.senado.leg.br/dados-abertos/sobre

### Key API Endpoints

**Senators (Senadores)**
- `GET /senador/lista/{legislatura}` - List senators
- `GET /senador/{codigo}` - Senator details
- `GET /senador/{codigo}/autorias` - Authored proposals
- `GET /senador/{codigo}/votacoes` - Voting history
- `GET /senador/{codigo}/comissoes` - Committee memberships

**Legislative Proposals (Matérias)**
- `GET /materia/pesquisa/lista` - Search proposals
- `GET /materia/{codigo}` - Proposal details
- `GET /materia/{codigo}/votacoes` - Voting history
- `GET /materia/{codigo}/tramitacoes` - Processing history
- `GET /materia/{codigo}/textos` - Proposal texts

**Voting (Votações)**
- `GET /votacao/lista/{data}` - List votes by date
- `GET /votacao/{codigo}` - Voting details
- `GET /votacao/{codigo}/votos` - Individual votes

**Committees (Comissões)**
- `GET /comissao/lista` - List committees
- `GET /comissao/{codigo}` - Committee details
- `GET /comissao/{codigo}/membros` - Members
- `GET /comissao/{codigo}/reunioes` - Meetings

**Parties (Partidos)**
- `GET /partido/lista` - List parties
- `GET /partido/{codigo}` - Party details
- `GET /partido/{codigo}/senadores` - Party senators
- `GET /bloco/lista` - Parliamentary blocs

**Reference Data**
- `GET /legislatura/lista` - Legislatures
- `GET /tipoMateria/lista` - Proposal types
- `GET /situacaoMateria/lista` - Proposal statuses
- `GET /uf/lista` - Brazilian states

### API Considerations

**Response Format**: The Senado API returns XML by default. Implementation will need:
- XML to JSON parser
- Accept headers for JSON format (if supported)
- Consistent JSON transformation

**Rate Limiting**: 
- Client-side rate limiting (30 req/min default)
- Exponential backoff for 429 responses
- Aggressive caching (5-minute TTL default)

## Tool Categories and Descriptions

### 1. Senator Tools (15+ tools)

**Purpose**: Query information about Brazilian senators including biography, voting records, and activities.

**Tools**:
- `senadores_listar` - List senators with filters (name, party, state, legislature)
- `senador_detalhes` - Get detailed senator information
- `senador_votacoes` - Get senator voting history
- `senador_autorias` - Get authored legislative proposals
- `senador_comissoes` - Get committee memberships
- `senador_licencas` - Get leave records
- `senador_mandatos` - Get mandate history
- `senador_liderancas` - Get leadership positions
- `senador_cargos` - Get positions held
- Additional tools for comprehensive senator data

**Example Use Cases**:
- "Show me all senators from São Paulo"
- "What is the voting record of Senator X?"
- "Which committees is Senator Y a member of?"

### 2. Proposal Tools (10+ tools)

**Purpose**: Access legislative proposals, bills, amendments, and their progress through the Senate.

**Tools**:
- `materias_pesquisar` - Search proposals with advanced filters
- `materia_detalhes` - Get detailed proposal information
- `materia_votacoes` - Get proposal voting history
- `materia_tramitacoes` - Get processing history
- `materia_textos` - Get proposal texts
- `materia_autores` - Get proposal authors
- `materia_relacionadas` - Get related proposals
- Additional tools for comprehensive proposal data

**Example Use Cases**:
- "Find all bills about education from 2024"
- "What is the current status of PLS 123/2024?"
- "Show me the voting history for this proposal"

### 3. Voting Tools (5+ tools)

**Purpose**: Access voting records, results, and individual senator votes.

**Tools**:
- `votacoes_listar` - List voting sessions with filters
- `votacao_detalhes` - Get detailed voting results
- `votacao_votos` - Get individual senator votes
- `votacao_orientacoes` - Get party voting orientations
- `votacao_estatisticas` - Get voting statistics

**Example Use Cases**:
- "Show me all votes from last week"
- "How did each senator vote on this bill?"
- "What was the party orientation for this vote?"

### 4. Committee Tools (5+ tools)

**Purpose**: Query Senate committees, their composition, and activities.

**Tools**:
- `comissoes_listar` - List all committees
- `comissao_detalhes` - Get committee details
- `comissao_membros` - Get committee members
- `comissao_reunioes` - Get meeting schedules
- `comissao_materias` - Get proposals under review

**Example Use Cases**:
- "List all permanent committees"
- "Who are the members of the Education Committee?"
- "What proposals are being reviewed by this committee?"

### 5. Party Tools (5+ tools)

**Purpose**: Analyze political parties and parliamentary blocs in the Senate.

**Tools**:
- `partidos_listar` - List all parties
- `partido_detalhes` - Get party details
- `partido_senadores` - Get party senators
- `blocos_listar` - List parliamentary blocs
- `bloco_detalhes` - Get bloc composition

**Example Use Cases**:
- "How many senators does each party have?"
- "Who is the leader of Party X?"
- "What parties form this parliamentary bloc?"

### 6. Reference Data Tools (10+ tools)

**Purpose**: Access reference data and classifications used in the legislative system.

**Tools**:
- `legislaturas_listar` - List all legislative sessions
- `tipos_materia_listar` - List proposal types
- `situacoes_materia_listar` - List proposal statuses
- `tipos_comissao_listar` - List committee types
- `ufs_listar` - List Brazilian states
- Additional reference data tools

**Example Use Cases**:
- "What are the different types of legislative proposals?"
- "List all possible proposal statuses"
- "Show me all legislatures since 1990"

## Implementation Phases

### Phase 1: Foundation (Tasks 1-4)
**Duration**: Estimated 1-2 weeks  
**Deliverables**:
- Project setup with TypeScript configuration
- Core infrastructure components (HTTP client, cache, circuit breaker, rate limiter, logger)
- MCP server core with tool registry
- Configuration management
- Input validation framework

**Key Milestones**:
- ✓ TypeScript project initialized
- ✓ All infrastructure components implemented and tested
- ✓ MCP server can register and invoke tools
- ✓ Configuration loaded from environment and files

### Phase 2: Tool Implementation (Tasks 5-10)
**Duration**: Estimated 3-4 weeks  
**Deliverables**:
- 15+ senator tools
- 10+ proposal tools
- 5+ voting tools
- 5+ committee tools
- 5+ party tools
- 10+ reference data tools

**Key Milestones**:
- ✓ All senator tools implemented and tested
- ✓ All proposal tools implemented and tested
- ✓ All voting tools implemented and tested
- ✓ All committee tools implemented and tested
- ✓ All party tools implemented and tested
- ✓ All reference tools implemented and tested

### Phase 3: Adapters and Deployment (Tasks 11-12)
**Duration**: Estimated 1-2 weeks  
**Deliverables**:
- CLI adapter (stdio transport)
- HTTP adapter (Express server with REST endpoints)
- Cloudflare Workers adapter
- Security implementation (authentication, CORS, sanitization)

**Key Milestones**:
- ✓ Stdio transport working with Claude Desktop
- ✓ HTTP server running with REST API
- ✓ Cloudflare Workers deployed and functional
- ✓ Security measures implemented and tested

### Phase 4: Testing (Task 13)
**Duration**: Estimated 1-2 weeks  
**Deliverables**:
- Unit tests for all components (70%+ coverage)
- Integration tests for API endpoints
- End-to-end tests for MCP protocol
- Performance tests

**Key Milestones**:
- ✓ All unit tests passing
- ✓ Integration tests passing
- ✓ E2e tests passing
- ✓ Performance benchmarks met

### Phase 5: Documentation and Release (Tasks 14-16)
**Duration**: Estimated 1 week  
**Deliverables**:
- Complete README with installation guides
- API documentation for all tools
- Configuration documentation
- Deployment guides
- Usage examples
- Developer documentation

**Key Milestones**:
- ✓ All documentation complete
- ✓ Package published to NPM
- ✓ Deployed to Cloudflare Workers
- ✓ Submitted to Smithery
- ✓ Tested with all supported AI assistants

## Reference Implementations

### mcp-camara
**Repository**: https://github.com/cristianoaredes/mcp-camara  
**Purpose**: MCP server for Brazilian Chamber of Deputies  
**Reusable Components**:
- Core MCP server architecture
- Tool registry pattern
- HTTP client with retries
- Cache layer implementation
- Rate limiter implementation
- Logger implementation
- Error handling patterns
- Test utilities

**Key Learnings**:
- Proven architecture for Brazilian legislative data
- Effective tool organization by category
- Successful multi-platform deployment
- Good documentation structure

### mcp-dadosbr
**Repository**: https://github.com/cristianoaredes/mcp-dadosbr  
**Purpose**: MCP server for Brazilian public data (CNPJ, CEP)  
**Reusable Components**:
- Circuit breaker implementation
- Advanced caching strategies
- Security patterns (API key auth, PII masking)
- Cloudflare Workers integration
- Smithery configuration

**Key Learnings**:
- Effective error handling and resilience
- Performance optimization techniques
- Security best practices
- Deployment automation

### mcp-server-template
**Repository**: https://github.com/cristianoaredes/mcp-server-template  
**Purpose**: Boilerplate for MCP servers  
**Reusable Components**:
- Project structure and organization
- Build and deployment scripts
- Testing setup with Vitest
- TypeScript configuration
- Tool scaffolding scripts

**Key Learnings**:
- Best practices for MCP server development
- Effective project organization
- Development workflow optimization

## Technical Specifications

### Data Models

#### Senator Model
```typescript
interface Senator {
  codigo: number;              // Unique senator code
  nome: string;                // Display name
  nomeCompleto: string;        // Full legal name
  sexo: 'M' | 'F';            // Gender
  dataNascimento: string;      // Birth date (ISO 8601)
  uf: string;                  // State (2-letter code)
  partido: {
    codigo: number;
    sigla: string;             // Party acronym (e.g., "PT", "PSDB")
    nome: string;              // Full party name
  };
  situacao: string;            // Current status
  email?: string;              // Contact email
  telefone?: string;           // Contact phone
  urlFoto?: string;            // Photo URL
  urlPagina?: string;          // Official page URL
}
```

#### Proposal Model
```typescript
interface Proposal {
  codigo: number;              // Unique proposal code
  sigla: string;               // Type acronym (e.g., "PLS", "PEC")
  numero: number;              // Proposal number
  ano: number;                 // Year
  ementa: string;              // Summary
  explicacao?: string;         // Detailed explanation
  dataApresentacao: string;    // Submission date (ISO 8601)
  situacao: {
    codigo: number;
    descricao: string;         // Current status
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
```

#### Voting Model
```typescript
interface Voting {
  codigo: number;              // Unique voting code
  data: string;                // Date (ISO 8601)
  hora: string;                // Time
  descricao: string;           // Description
  resultado: 'APROVADO' | 'REJEITADO' | 'RETIRADO';
  tipoVotacao: 'NOMINAL' | 'SIMBÓLICA' | 'SECRETA';
  materia?: {
    codigo: number;
    sigla: string;
    numero: number;
    ano: number;
  };
  totalSim: number;            // Yes votes
  totalNao: number;            // No votes
  totalAbstencao: number;      // Abstentions
  totalObstrucao: number;      // Obstructions
}
```

### Error Handling

#### Error Types
```typescript
// API errors
class SenadoAPIError extends Error {
  statusCode: number;
  endpoint: string;
  details?: unknown;
}

// Validation errors
class ValidationError extends Error {
  field: string;
  value: unknown;
}

// Rate limit errors
class RateLimitError extends Error {
  retryAfter: number;
}

// Circuit breaker errors
class CircuitBreakerError extends Error {}
```

#### Error Response Format
All errors returned as MCP tool results:
```json
{
  "content": [{
    "type": "text",
    "text": "Error: [Type] - [Message]\nDetails: [Context]"
  }],
  "isError": true
}
```

### Performance Requirements

**Response Times**:
- Cached responses: < 50ms
- Uncached API calls: < 2s (p95)
- Tool invocation overhead: < 10ms

**Throughput**:
- Rate limit: 30 requests/minute (configurable)
- Concurrent requests: Up to 10 simultaneous

**Caching**:
- Default TTL: 5 minutes
- Cache hit rate target: > 70%
- Max cache size: 1000 entries (LRU eviction)

**Reliability**:
- Circuit breaker threshold: 5 failures
- Retry attempts: 3 with exponential backoff
- Timeout: 30 seconds per request

### Security Requirements

**Authentication**:
- API key authentication for REST endpoints
- No authentication for MCP protocol (stdio/SSE)
- Support for X-API-Key and Authorization headers

**Input Validation**:
- Zod schema validation for all inputs
- String length limits (max 100 chars for names)
- Numeric range validation
- Special character sanitization

**Data Privacy**:
- PII masking in logs (names, emails, phones)
- No storage of personal data
- Log retention: 30 days maximum
- LGPD compliance

**CORS**:
- Configurable allowed origins
- Appropriate Access-Control headers
- Preflight request handling

## Deployment Strategies

### NPM Package Deployment

**Package Configuration**:
```json
{
  "name": "@aredes.me/mcp-senado",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "mcp-senado": "build/lib/bin/mcp-senado.js"
  },
  "files": ["build/", "README.md", "LICENSE"]
}
```

**Installation**:
```bash
# Global installation
npm install -g @aredes.me/mcp-senado

# Direct execution
npx @aredes.me/mcp-senado

# Local installation
npm install @aredes.me/mcp-senado
```

**Configuration Files**:
- `.env` - Environment variables
- `.mcprc.json` - JSON configuration
- IDE-specific configs (claude_desktop_config.json, settings.json)

### Cloudflare Workers Deployment

**Worker Configuration** (wrangler.toml):
```toml
name = "mcp-senado"
main = "build/lib/workers/worker.js"
compatibility_date = "2024-01-01"

[env.production]
name = "mcp-senado-prod"
route = "mcp-senado.aredes.me/*"

[[kv_namespaces]]
binding = "MCP_CACHE"
id = "..."

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "..."
```

**Deployment Commands**:
```bash
# Development
npm run workers:deploy:dev

# Production
npm run workers:deploy:prod

# View logs
npm run workers:tail
```

**Environment Variables**:
```bash
wrangler secret put MCP_API_KEY
wrangler secret put SENADO_API_BASE_URL
```

### Smithery Deployment

**Configuration** (smithery.yaml):
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

clients:
  - claude
  - cursor
  - windsurf
  - continue
```

**Installation**:
```bash
npx -y @smithery/cli install @aredes.me/mcp-senado --client claude
```

## Testing Strategy

### Unit Tests (70%+ coverage)

**Core Components**:
- MCP server initialization and tool registration
- Tool registry operations
- Input validation with Zod schemas
- Error handling and transformation

**Infrastructure Components**:
- HTTP client with mock responses
- Cache operations (get, set, delete, clear)
- Circuit breaker state transitions
- Rate limiter token bucket algorithm
- Logger with different log levels

**Tool Implementations**:
- All senator tool handlers
- All proposal tool handlers
- All voting tool handlers
- All committee tool handlers
- All party tool handlers
- All reference tool handlers

### Integration Tests

**API Integration**:
- Real API calls to verify endpoints
- Error handling with API error scenarios
- Caching behavior with real API calls
- Rate limiting with multiple requests

### End-to-End Tests

**MCP Protocol**:
- Full MCP protocol flow
- Tool invocation from client perspective
- Stdio transport communication
- HTTP transport communication

**AI Assistant Integration**:
- Claude Desktop integration
- Cursor IDE integration
- Windsurf IDE integration
- Continue.dev integration

### Performance Tests

**Benchmarks**:
- Response time measurements
- Cache hit rate analysis
- Rate limiting behavior
- Circuit breaker functionality
- Concurrent request handling

## Documentation Plan

### User Documentation

**README.md**:
- Project overview and features
- Quick start guide
- Installation instructions for all IDEs
- Configuration examples
- Available tools reference
- Troubleshooting guide
- Links to detailed documentation

**docs/CONFIGURATION.md**:
- Environment variables reference
- Configuration file format (.mcprc.json)
- Advanced configuration options
- Platform-specific settings

**docs/USAGE_EXAMPLES.md**:
- Common use cases with example prompts
- Integration patterns with AI assistants
- Best practices for tool usage
- Real-world scenarios

**docs/API.md**:
- Complete tool reference (50+ tools)
- Input/output schemas for each tool
- Error codes and messages
- Rate limiting information

**docs/TROUBLESHOOTING.md**:
- Common issues and solutions
- Debugging tips
- Error message explanations
- FAQ

### Developer Documentation

**docs/ARCHITECTURE.md**:
- System architecture diagrams
- Component descriptions
- Design patterns used
- Data flow explanations

**docs/CONTRIBUTING.md**:
- Development setup instructions
- Code style guide
- Testing guidelines
- Pull request process
- Release process

**docs/DEPLOYMENT.md**:
- NPM deployment guide
- Cloudflare Workers deployment guide
- Smithery deployment guide
- Environment setup for each platform
- CI/CD configuration

**docs/DEVELOPMENT.md**:
- Local development setup
- Running tests
- Building the project
- Debugging techniques
- Tool scaffolding

## Risk Assessment and Mitigation

### Technical Risks

**Risk 1: XML Response Format**
- **Impact**: High - Senado API returns XML, not JSON
- **Probability**: Certain
- **Mitigation**: Implement robust XML to JSON parser, test thoroughly with real API responses

**Risk 2: API Rate Limiting**
- **Impact**: Medium - Could affect user experience
- **Probability**: Medium
- **Mitigation**: Implement aggressive caching, client-side rate limiting, exponential backoff

**Risk 3: API Availability**
- **Impact**: High - Service unavailable if API is down
- **Probability**: Low
- **Mitigation**: Circuit breaker pattern, graceful degradation, clear error messages

**Risk 4: API Documentation Accuracy**
- **Impact**: Medium - Incorrect implementation if docs are wrong
- **Probability**: Medium
- **Mitigation**: Test with real API calls, verify against Swagger documentation, iterate based on findings

### Project Risks

**Risk 5: Scope Creep**
- **Impact**: Medium - Could delay delivery
- **Probability**: Medium
- **Mitigation**: Clear requirements document, phased implementation, regular reviews

**Risk 6: Compatibility Issues**
- **Impact**: Medium - May not work with all AI assistants
- **Probability**: Low
- **Mitigation**: Test with multiple clients, follow MCP specification strictly, reference working implementations

## Success Criteria

### Functional Requirements
- ✓ All 50+ tools implemented and working
- ✓ Successful integration with Claude Desktop, Cursor, Windsurf, Continue.dev
- ✓ All API endpoints correctly mapped and tested
- ✓ Error handling covers all edge cases
- ✓ Configuration works across all platforms

### Performance Requirements
- ✓ Response times meet targets (< 50ms cached, < 2s uncached)
- ✓ Cache hit rate > 70%
- ✓ Rate limiting prevents API abuse
- ✓ Circuit breaker prevents cascading failures

### Quality Requirements
- ✓ Unit test coverage > 70%
- ✓ All integration tests passing
- ✓ All e2e tests passing
- ✓ Zero critical security vulnerabilities
- ✓ TypeScript strict mode with no errors

### Documentation Requirements
- ✓ Complete README with installation guides
- ✓ API documentation for all tools
- ✓ Configuration documentation
- ✓ Deployment guides for all platforms
- ✓ Developer documentation

### Deployment Requirements
- ✓ Published to NPM
- ✓ Deployed to Cloudflare Workers
- ✓ Submitted to Smithery
- ✓ CI/CD pipeline configured
- ✓ Monitoring and alerting set up

## Next Steps

1. **Review and Approval**: Review this implementation plan and approve to proceed
2. **Repository Setup**: Create GitHub repository and initialize project
3. **Phase 1 Execution**: Begin implementation of foundation components
4. **Iterative Development**: Follow phased approach with regular reviews
5. **Testing and Validation**: Comprehensive testing at each phase
6. **Documentation**: Write documentation alongside implementation
7. **Deployment**: Deploy to all platforms and test integration
8. **Release**: Publish version 1.0.0 and announce availability

## Appendix

### Glossary

- **MCP**: Model Context Protocol - Protocol for AI assistants to interact with external tools
- **Senado Federal**: Brazilian Federal Senate (upper house of Congress)
- **Senador**: Senator (member of the Federal Senate)
- **Matéria**: Legislative proposal or matter
- **Votação**: Voting session
- **Comissão**: Committee
- **Partido**: Political party
- **Tramitação**: Legislative processing flow
- **Legislatura**: Legislative session/term
- **LGPD**: Lei Geral de Proteção de Dados (Brazilian data protection law)

### Acronyms

- **API**: Application Programming Interface
- **CLI**: Command Line Interface
- **CORS**: Cross-Origin Resource Sharing
- **HTTP**: Hypertext Transfer Protocol
- **JSON**: JavaScript Object Notation
- **KV**: Key-Value (Cloudflare storage)
- **LRU**: Least Recently Used (cache eviction)
- **NPM**: Node Package Manager
- **PII**: Personally Identifiable Information
- **REST**: Representational State Transfer
- **SDK**: Software Development Kit
- **SSE**: Server-Sent Events
- **TTL**: Time To Live (cache duration)
- **UF**: Unidade Federativa (Brazilian state)
- **XML**: Extensible Markup Language

### Contact and Support

**Project Maintainer**: Cristiano Aredes  
**Email**: cristiano@aredes.me  
**LinkedIn**: https://www.linkedin.com/in/cristianoaredes/  
**GitHub**: https://github.com/cristianoaredes

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Planning Phase - Ready for Implementation
