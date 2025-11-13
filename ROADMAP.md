# MCP Senado Federal - Implementation Roadmap

**Project Status**: Planning Complete → Implementation Phase
**Current State**: 0% implemented
**Documentation**: 100% complete
**Target**: Production-ready MCP server with 50+ tools

---

## Executive Summary

This roadmap outlines the complete implementation path for the MCP Senado Federal project. The project has excellent planning documentation but zero code implementation. The goal is to build a production-ready MCP server that provides AI assistants with access to Brazilian Federal Senate legislative data.

### Project Overview

- **What**: MCP server for Brazilian Federal Senate Open Data API
- **Why**: Enable AI assistants (Claude, Cursor, Windsurf, Continue.dev) to query legislative data
- **Scope**: 50+ tools across 6 categories (Senators, Proposals, Voting, Committees, Parties, Reference Data)
- **Deployment**: NPM package, Cloudflare Workers, Smithery
- **Timeline**: 6-9 weeks (estimated)

---

## Current State Assessment

### ✅ Completed (100%)
- [x] Requirements documentation (15 detailed requirements)
- [x] Design documentation (939 lines of technical specs)
- [x] Implementation plan (877 lines with 5 phases)
- [x] Task breakdown (552 lines, 16 major tasks, 80+ subtasks)
- [x] Project infrastructure (README, CONTRIBUTING, LICENSE, package.json)
- [x] References and resources (556 lines)

### ❌ Not Started (0%)
- [ ] All code implementation (lib/ directory doesn't exist)
- [ ] All tests (test/ directory doesn't exist)
- [ ] Build configuration (tsconfig.json, vitest.config.ts)
- [ ] Deployment configuration (wrangler.toml, smithery.yaml)
- [ ] CI/CD pipeline

---

## Implementation Roadmap

### 🎯 Phase 0: Pre-Implementation Setup (Week 1, Days 1-2)

**Goal**: Set up development environment and project structure

#### Tasks
- [ ] Create directory structure
  ```
  lib/
    adapters/
    bin/
    config/
    core/
    infrastructure/
    tools/
    types/
    workers/
  test/
    unit/
    integration/
    e2e/
  scripts/
  ```
- [ ] Create `tsconfig.json` with strict mode
- [ ] Create `vitest.config.ts` for testing
- [ ] Create `.env.example` with all configuration variables
- [ ] Install all dependencies (`npm install`)
- [ ] Set up Git pre-commit hooks
- [ ] Create `wrangler.toml` for Cloudflare Workers
- [ ] Create `smithery.yaml` for Smithery deployment

**Deliverables**:
- ✓ Complete directory structure
- ✓ All config files created
- ✓ Dependencies installed
- ✓ Project builds successfully (even with no code)

**Estimated Duration**: 1-2 days

---

### 🏗️ Phase 1: Foundation (Week 1-2)

**Goal**: Build core infrastructure components and MCP server foundation

#### 1.1 Infrastructure Components (Week 1, Days 3-5)

**Critical Priority**: These are required by all other components

- [ ] **HTTP Client** (`lib/infrastructure/http-client.ts`)
  - Implement `SenadoHttpClient` class
  - Add XML to JSON parser (Senado API returns XML)
  - Implement retry logic with exponential backoff
  - Add timeout handling (30s default)
  - Add request/response logging
  - **Key Risk**: XML parsing - must be robust

- [ ] **Cache Layer** (`lib/infrastructure/cache.ts`)
  - Implement LRU cache with TTL (5-minute default)
  - Add cache key generation from tool name + params
  - Add statistics tracking (hits, misses, size)
  - Implement get, set, delete, clear methods
  - **Performance Target**: 70%+ cache hit rate

- [ ] **Circuit Breaker** (`lib/infrastructure/circuit-breaker.ts`)
  - Implement 3-state machine (closed, open, half-open)
  - Failure threshold: 5 consecutive failures
  - Recovery timeout: 60 seconds
  - Success threshold for closing: 2 successes

- [ ] **Rate Limiter** (`lib/infrastructure/rate-limiter.ts`)
  - Implement token bucket algorithm
  - Default: 30 requests/minute
  - Token refill logic with configurable interval

- [ ] **Logger** (`lib/infrastructure/logger.ts`)
  - Structured logging (DEBUG, INFO, WARN, ERROR)
  - PII masking (names, emails, phones)
  - Context objects for rich logging
  - Specialized methods (logToolInvocation, logCacheHit, logError)

**Tests**: Unit tests for each component (target: 70%+ coverage)

**Deliverables**:
- ✓ All 5 infrastructure components implemented
- ✓ Unit tests passing for each component
- ✓ XML parser working with real Senado API responses

**Estimated Duration**: 3-4 days

#### 1.2 Core MCP Server (Week 2, Days 1-3)

- [ ] **Tool Registry** (`lib/core/tools.ts`)
  - Create `ToolDefinition` interface
  - Create `ToolContext` interface
  - Implement `ToolRegistry` class
  - Methods: register, registerMany, get, getAll, count
  - Tool validation on registration

- [ ] **Input Validation** (`lib/core/validation.ts`)
  - Create Zod schemas for all tool inputs
  - Implement `validateToolInput` function
  - Add input sanitization (trim, validate ranges)
  - Create `ValidationError` class

- [ ] **Error Handling** (`lib/core/errors.ts`)
  - Create `SenadoAPIError` class
  - Create `RateLimitError` class
  - Create `CircuitBreakerError` class
  - Implement error-to-ToolResult transformation

- [ ] **MCP Server Core** (`lib/core/mcp-server.ts`)
  - Create `SenadoServer` class extending MCP SDK Server
  - Implement server initialization
  - Set up MCP protocol handlers (tools/list, tools/call)
  - Implement tool invocation pipeline (validation → cache check → execute → cache store)
  - Add server statistics and health check

- [ ] **Configuration Management** (`lib/config/config.ts`)
  - Create `MCPServerConfig` interface
  - Implement environment variable loading (dotenv)
  - Add `.mcprc.json` file support
  - Configuration validation with defaults

**Tests**: Unit tests for all core components

**Deliverables**:
- ✓ MCP server can register tools
- ✓ MCP server can invoke tools
- ✓ Configuration loaded from environment
- ✓ All error handling in place

**Estimated Duration**: 3-4 days

**Phase 1 Milestone**: Foundation complete, ready for tool implementation

---

### 🔧 Phase 2: Tool Implementation (Week 3-6)

**Goal**: Implement all 50+ tools across 6 categories

#### 2.1 Senator Tools (Week 3, Days 1-3)

**15+ tools planned**

- [ ] `senadores_listar` - List senators with filters
- [ ] `senador_detalhes` - Get senator details
- [ ] `senador_votacoes` - Get voting history
- [ ] `senador_autorias` - Get authored proposals
- [ ] `senador_comissoes` - Get committee memberships
- [ ] `senador_licencas` - Get leave records
- [ ] `senador_mandatos` - Get mandate history
- [ ] `senador_liderancas` - Get leadership positions
- [ ] `senador_cargos` - Get positions held
- [ ] Additional senator tools (6+ more)

**File**: `lib/tools/senator-tools.ts`

**Tests**: Unit tests with mocked API responses

**Deliverables**: All senator tools working with real API

**Estimated Duration**: 3-4 days

#### 2.2 Proposal Tools (Week 3, Days 4-5 + Week 4, Days 1-2)

**10+ tools planned**

- [ ] `materias_pesquisar` - Search proposals with filters
- [ ] `materia_detalhes` - Get proposal details
- [ ] `materia_votacoes` - Get voting history
- [ ] `materia_tramitacoes` - Get processing history
- [ ] `materia_textos` - Get proposal texts
- [ ] `materia_autores` - Get proposal authors
- [ ] `materia_relacionadas` - Get related proposals
- [ ] Additional proposal tools (3+ more)

**File**: `lib/tools/proposal-tools.ts`

**Tests**: Unit tests with mocked API responses

**Deliverables**: All proposal tools working with real API

**Estimated Duration**: 3-4 days

#### 2.3 Voting Tools (Week 4, Days 3-4)

**5+ tools planned**

- [ ] `votacoes_listar` - List voting sessions
- [ ] `votacao_detalhes` - Get voting details
- [ ] `votacao_votos` - Get individual senator votes
- [ ] `votacao_orientacoes` - Get party voting orientations
- [ ] `votacao_estatisticas` - Get voting statistics

**File**: `lib/tools/voting-tools.ts`

**Tests**: Unit tests with mocked API responses

**Deliverables**: All voting tools working with real API

**Estimated Duration**: 2 days

#### 2.4 Committee Tools (Week 4, Day 5 + Week 5, Days 1-2)

**5+ tools planned**

- [ ] `comissoes_listar` - List all committees
- [ ] `comissao_detalhes` - Get committee details
- [ ] `comissao_membros` - Get committee members
- [ ] `comissao_reunioes` - Get meeting schedules
- [ ] `comissao_materias` - Get proposals under review

**File**: `lib/tools/committee-tools.ts`

**Tests**: Unit tests with mocked API responses

**Deliverables**: All committee tools working with real API

**Estimated Duration**: 2-3 days

#### 2.5 Party Tools (Week 5, Days 3-4)

**5+ tools planned**

- [ ] `partidos_listar` - List all parties
- [ ] `partido_detalhes` - Get party details
- [ ] `partido_senadores` - Get party senators
- [ ] `blocos_listar` - List parliamentary blocs
- [ ] `bloco_detalhes` - Get bloc composition

**File**: `lib/tools/party-tools.ts`

**Tests**: Unit tests with mocked API responses

**Deliverables**: All party tools working with real API

**Estimated Duration**: 2 days

#### 2.6 Reference Data Tools (Week 5, Day 5 + Week 6, Days 1-2)

**10+ tools planned**

- [ ] `legislaturas_listar` - List all legislatures
- [ ] `tipos_materia_listar` - List proposal types
- [ ] `situacoes_materia_listar` - List proposal statuses
- [ ] `tipos_comissao_listar` - List committee types
- [ ] `ufs_listar` - List Brazilian states
- [ ] Additional reference tools (5+ more)

**File**: `lib/tools/reference-tools.ts`

**Tests**: Unit tests with mocked API responses

**Deliverables**: All reference tools working with real API

**Estimated Duration**: 2-3 days

**Phase 2 Milestone**: All 50+ tools implemented and tested

---

### 🚀 Phase 3: Adapters and Deployment (Week 6-7)

**Goal**: Enable multiple deployment platforms

#### 3.1 CLI Adapter (Week 6, Days 3-4)

- [ ] **CLI Adapter** (`lib/adapters/cli.ts`)
  - Initialize SenadoServer with configuration
  - Connect to StdioServerTransport
  - Add graceful shutdown handling
  - Add error logging

- [ ] **Binary Entry Point** (`lib/bin/mcp-senado.ts`)
  - Create executable entry point
  - Load configuration
  - Start CLI adapter
  - Handle process signals

**Tests**: E2E test with stdio communication

**Deliverables**: Works with Claude Desktop via stdio

**Estimated Duration**: 2 days

#### 3.2 HTTP Adapter (Week 6, Day 5 + Week 7, Days 1-2)

- [ ] **HTTP Server** (`lib/adapters/http.ts`)
  - Create Express server
  - Implement `/mcp` endpoint for MCP protocol over HTTP
  - Implement REST endpoints for direct API access
  - Add `/health` endpoint for monitoring
  - Implement SSE transport for streaming
  - Add CORS configuration

**Tests**: E2E test with HTTP requests

**Deliverables**: HTTP server running and accessible

**Estimated Duration**: 2-3 days

#### 3.3 Cloudflare Workers Adapter (Week 7, Days 3-4)

- [ ] **Workers Adapter** (`lib/workers/worker.ts`)
  - Implement fetch handler
  - Integrate KV storage for caching
  - Implement KV-based rate limiting
  - Add API key authentication
  - Create OpenAPI specification endpoint

- [ ] **Workers Configuration** (`wrangler.toml`)
  - Configure KV namespaces
  - Set environment variables
  - Configure routes

**Tests**: Deploy to Cloudflare Workers dev environment

**Deliverables**: Workers deployed and functional

**Estimated Duration**: 2 days

#### 3.4 Security Implementation (Week 7, Day 5)

- [ ] API key authentication middleware
- [ ] CORS protection
- [ ] Input sanitization
- [ ] PII masking in logs
- [ ] Security audit

**Tests**: Security testing

**Deliverables**: All security measures in place

**Estimated Duration**: 1 day

**Phase 3 Milestone**: All deployment platforms working

---

### 🧪 Phase 4: Testing (Week 8)

**Goal**: Comprehensive testing across all components

#### 4.1 Unit Tests (Week 8, Days 1-2)

- [ ] Complete unit test coverage for all components
- [ ] Target: 70%+ code coverage
- [ ] Test all infrastructure components
- [ ] Test all tools with mocked API
- [ ] Test error handling

**Tools**: Vitest with coverage reports

**Deliverables**: 70%+ code coverage achieved

**Estimated Duration**: 2 days

#### 4.2 Integration Tests (Week 8, Days 3-4)

- [ ] Test real API endpoints
- [ ] Test error scenarios with API
- [ ] Test caching behavior
- [ ] Test rate limiting
- [ ] Test circuit breaker

**Deliverables**: All integration tests passing

**Estimated Duration**: 2 days

#### 4.3 End-to-End Tests (Week 8, Day 5)

- [ ] Test full MCP protocol flow
- [ ] Test with Claude Desktop
- [ ] Test with Cursor IDE
- [ ] Test with Windsurf IDE
- [ ] Test with Continue.dev

**Deliverables**: Working with all AI assistants

**Estimated Duration**: 1 day

#### 4.4 Performance Testing (Week 8, Weekend)

- [ ] Measure cache hit rates
- [ ] Measure response times
- [ ] Test rate limiting under load
- [ ] Test circuit breaker behavior
- [ ] Test concurrent request handling

**Performance Targets**:
- Cached responses: < 50ms
- Uncached API calls: < 2s (p95)
- Cache hit rate: > 70%

**Deliverables**: Performance benchmarks met

**Estimated Duration**: 1-2 days

**Phase 4 Milestone**: All tests passing, performance targets met

---

### 📚 Phase 5: Documentation and Release (Week 9)

**Goal**: Complete documentation and release v1.0.0

#### 5.1 User Documentation (Week 9, Days 1-2)

- [ ] Update README.md with installation guides
- [ ] Create `docs/API.md` - Complete tool reference
- [ ] Create `docs/CONFIGURATION.md` - Configuration reference
- [ ] Create `docs/USAGE_EXAMPLES.md` - Real-world examples
- [ ] Create `docs/TROUBLESHOOTING.md` - Common issues

**Deliverables**: Complete user documentation

**Estimated Duration**: 2 days

#### 5.2 Developer Documentation (Week 9, Days 3-4)

- [ ] Create `docs/ARCHITECTURE.md` - System architecture
- [ ] Update `CONTRIBUTING.md` - Development guide
- [ ] Create `docs/DEPLOYMENT.md` - Deployment guides
- [ ] Create `docs/DEVELOPMENT.md` - Local setup guide
- [ ] Add inline code documentation

**Deliverables**: Complete developer documentation

**Estimated Duration**: 2 days

#### 5.3 Release Preparation (Week 9, Day 5)

- [ ] Update CHANGELOG.md
- [ ] Bump version to 1.0.0
- [ ] Create GitHub release
- [ ] Publish to NPM (`npm publish`)
- [ ] Deploy to Cloudflare Workers production
- [ ] Submit to Smithery
- [ ] Announce release

**Deliverables**: v1.0.0 released on all platforms

**Estimated Duration**: 1 day

**Phase 5 Milestone**: Project released and production-ready

---

## Success Criteria

### Functional Requirements ✅
- [ ] All 50+ tools implemented and working
- [ ] Integration with Claude Desktop, Cursor, Windsurf, Continue.dev
- [ ] All API endpoints correctly mapped
- [ ] Error handling covers all edge cases
- [ ] Configuration works across all platforms

### Performance Requirements ✅
- [ ] Response times: < 50ms cached, < 2s uncached
- [ ] Cache hit rate: > 70%
- [ ] Rate limiting prevents API abuse
- [ ] Circuit breaker prevents cascading failures

### Quality Requirements ✅
- [ ] Unit test coverage: > 70%
- [ ] All integration tests passing
- [ ] All e2e tests passing
- [ ] Zero critical security vulnerabilities
- [ ] TypeScript strict mode with no errors

### Documentation Requirements ✅
- [ ] Complete README with installation guides
- [ ] API documentation for all tools
- [ ] Configuration documentation
- [ ] Deployment guides for all platforms
- [ ] Developer documentation

### Deployment Requirements ✅
- [ ] Published to NPM
- [ ] Deployed to Cloudflare Workers
- [ ] Submitted to Smithery
- [ ] CI/CD pipeline configured
- [ ] Monitoring set up

---

## Risk Management

### High Priority Risks

#### 🔴 Risk 1: XML Response Format
- **Impact**: High - Senado API returns XML, not JSON
- **Probability**: Certain
- **Mitigation**:
  - Test XML parser early with real API responses
  - Consider using fast-xml-parser or xml2js library
  - Build comprehensive tests for XML parsing
  - Have fallback strategies

#### 🟡 Risk 2: API Rate Limiting
- **Impact**: Medium - Could affect user experience
- **Probability**: Medium
- **Mitigation**:
  - Implement aggressive caching (5-min TTL)
  - Client-side rate limiting (30 req/min)
  - Exponential backoff for 429 responses
  - Monitor actual API limits

#### 🟡 Risk 3: API Documentation Accuracy
- **Impact**: Medium - Incorrect implementation
- **Probability**: Medium
- **Mitigation**:
  - Test with real API calls early
  - Verify against Swagger documentation
  - Document any discrepancies found
  - Iterate based on findings

#### 🟢 Risk 4: Scope Creep
- **Impact**: Medium - Could delay delivery
- **Probability**: Low with this roadmap
- **Mitigation**:
  - Follow this roadmap strictly
  - Phase implementation as planned
  - Regular milestone reviews
  - Can reduce tools for MVP if needed

---

## Resource Requirements

### Development Tools
- [x] Node.js 18+ installed
- [x] TypeScript 5.7+ installed
- [x] Git for version control
- [ ] Claude Desktop for testing
- [ ] Cursor/Windsurf/Continue.dev for testing
- [ ] Cloudflare Workers account

### External Services
- [ ] Senado Federal API access (public, no key needed)
- [ ] NPM account for publishing
- [ ] Cloudflare Workers account
- [ ] Smithery account (optional)
- [ ] GitHub for CI/CD

### Time Commitment
- **Estimated Total**: 6-9 weeks
- **Recommended**: Full-time focus
- **Minimum**: 20-30 hours/week for 9-12 weeks

---

## Milestones and Checkpoints

### Week 1: Foundation Setup ✅
- [ ] Development environment ready
- [ ] All infrastructure components working
- [ ] First tool successfully invoked

### Week 2: Core Complete ✅
- [ ] MCP server core operational
- [ ] Tool registry working
- [ ] Configuration system complete

### Week 4: 50% Tools Complete ✅
- [ ] Senator tools done
- [ ] Proposal tools done
- [ ] Integration tests passing

### Week 6: All Tools Complete ✅
- [ ] All 50+ tools implemented
- [ ] All tool tests passing
- [ ] Ready for adapter phase

### Week 7: Deployment Ready ✅
- [ ] All adapters working
- [ ] Security implemented
- [ ] Deployed to all platforms

### Week 8: Tested and Validated ✅
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Working with all AI assistants

### Week 9: Released ✅
- [ ] Documentation complete
- [ ] v1.0.0 released
- [ ] Available on NPM, Workers, Smithery

---

## Next Steps (Immediate Actions)

### Start Here 🚀

1. **Today - Environment Setup**
   ```bash
   # Create directory structure
   mkdir -p lib/{adapters,bin,config,core,infrastructure,tools,types,workers}
   mkdir -p test/{unit,integration,e2e}
   mkdir -p scripts docs/plan

   # Install dependencies
   npm install

   # Create config files
   touch tsconfig.json vitest.config.ts .env.example wrangler.toml smithery.yaml
   ```

2. **Tomorrow - Start Phase 1**
   - Implement HTTP Client with XML parser
   - Test with real Senado API
   - Implement Cache Layer
   - Write unit tests

3. **This Week - Complete Foundation**
   - All infrastructure components
   - Core MCP server
   - First working tool
   - Initial tests passing

4. **Track Progress**
   - Update this roadmap as you complete tasks
   - Mark completed items with [x]
   - Document any deviations or issues
   - Adjust timeline as needed

---

## References

### Documentation
- [Implementation Plan](./docs/plan/senado-mcp-implementation-plan.md) - 877 lines
- [Design Document](./.kiro/specs/senado-mcp/design.md) - 939 lines
- [Tasks Document](./.kiro/specs/senado-mcp/tasks.md) - 552 lines
- [Requirements](./.kiro/specs/senado-mcp/requirements.md) - 15 requirements
- [References](./docs/plan/references-and-resources.md) - 556 lines

### API Resources
- [Senado API Swagger](https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html)
- [Senado Open Data](https://www12.senado.leg.br/dados-abertos)
- [API v3 Docs](https://legis.senado.leg.br/dadosabertos/v3/api-docs)

### Reference Projects
- [mcp-camara](https://github.com/cristianoaredes/mcp-camara) - Chamber of Deputies MCP
- [mcp-dadosbr](https://github.com/cristianoaredes/mcp-dadosbr) - Brazilian public data MCP
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Official MCP SDK

---

## Appendix: Quick Commands

### Development
```bash
# Start development server
npm run dev

# Build project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Deployment
```bash
# Publish to NPM
npm publish

# Deploy to Cloudflare Workers (dev)
npm run workers:deploy:dev

# Deploy to Cloudflare Workers (prod)
npm run workers:deploy:prod

# Submit to Smithery
npx @smithery/cli publish
```

### Testing with AI Assistants
```bash
# Test with Claude Desktop
npx @aredes.me/mcp-senado

# Test HTTP server
npm run http:start
```

---

**Document Version**: 1.0
**Created**: 2025-01-13
**Last Updated**: 2025-01-13
**Status**: Active Roadmap
