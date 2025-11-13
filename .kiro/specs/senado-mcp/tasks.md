# Implementation Plan - MCP Senado Federal

This implementation plan breaks down the development of the MCP Senado Federal server into discrete, manageable tasks. Each task builds incrementally on previous work, following the architecture defined in the design document.

## Task List

- [ ] 1. Project Setup and Foundation
  - Initialize TypeScript project with strict mode configuration
  - Set up package.json with dependencies (@modelcontextprotocol/sdk, express, zod, vitest)
  - Create directory structure (lib/adapters, lib/core, lib/infrastructure, lib/tools, lib/workers)
  - Configure tsconfig.json for Node.js 18+ and ES modules
  - Set up .env.example with all configuration variables
  - Create .gitignore for node_modules, build, .env files
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 2. Core Infrastructure Components
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 9.5_

- [ ] 2.1 Implement HTTP Client for Senado API
  - Create SenadoHttpClient class with configurable timeout and retry logic
  - Implement GET and POST methods with proper error handling
  - Add XML to JSON response parser (Senado API returns XML)
  - Implement exponential backoff retry strategy (3 attempts, 1s initial delay)
  - Add request/response logging with duration tracking
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.2 Implement Cache Layer
  - Create CacheInterface with get, set, delete, clear, generateKey methods
  - Implement LRU cache with configurable TTL (default 5 minutes)
  - Implement cache key generation from tool name and parameters
  - Add cache statistics tracking (hits, misses, size)
  - _Requirements: 9.1, 9.4_

- [ ] 2.3 Implement Circuit Breaker
  - Create CircuitBreaker class with three states (closed, open, half-open)
  - Implement failure threshold detection (5 consecutive failures)
  - Add automatic recovery testing after timeout (60 seconds)
  - Implement success threshold for closing circuit (2 successes)
  - _Requirements: 9.3_

- [ ] 2.4 Implement Rate Limiter
  - Create RateLimiter class using token bucket algorithm
  - Configure default limits (30 requests per minute)
  - Implement token refill logic with configurable interval
  - Add rate limit violation tracking and logging
  - _Requirements: 9.2_

- [ ] 2.5 Implement Structured Logger
  - Create Logger class with DEBUG, INFO, WARN, ERROR levels
  - Implement structured logging with context objects
  - Add PII masking for sensitive data (names, emails)
  - Implement specialized log methods (logToolInvocation, logCacheHit, logError)
  - _Requirements: 9.5, 11.4_

- [ ] 3. Core MCP Server Implementation
  - _Requirements: 1.1, 1.2, 1.3, 12.5_

- [ ] 3.1 Implement Tool Registry
  - Create ToolDefinition interface (name, description, inputSchema, handler, category)
  - Create ToolContext interface (httpClient, cache, config, logger)
  - Implement ToolRegistry class with register, registerMany, get, getAll, count methods
  - Add tool validation on registration
  - _Requirements: 1.1_

- [ ] 3.2 Implement MCP Server Core
  - Create SenadoServer class extending MCP SDK Server
  - Implement server initialization with dependency injection support
  - Set up MCP protocol handlers (tools/list, tools/call)
  - Implement tool invocation with validation, caching, and error handling
  - Add server statistics and health check methods
  - Convert Zod schemas to JSON Schema for MCP protocol
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.3 Implement Input Validation
  - Create Zod schemas for all tool inputs
  - Implement validateToolInput function with error handling
  - Add input sanitization (trim strings, validate ranges)
  - Create ValidationError class with field and value context
  - _Requirements: 11.5_

- [ ] 3.4 Implement Error Handling
  - Create SenadoAPIError class with statusCode, endpoint, details
  - Create RateLimitError class with retryAfter
  - Create CircuitBreakerError class
  - Implement error-to-ToolResult transformation
  - Add error logging with stack traces
  - _Requirements: 2.3_

- [ ] 4. Configuration Management
  - _Requirements: 1.5, 12.3_

- [ ] 4.1 Implement Configuration Loader
  - Create MCPServerConfig interface with all configuration options
  - Implement environment variable loading with dotenv
  - Add .mcprc.json file support for JSON configuration
  - Implement configuration validation with sensible defaults
  - Add configuration documentation in code comments
  - _Requirements: 1.5, 12.3_

- [ ] 5. Senator Tools Implementation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5.1 Implement Senator Listing Tool
  - Create senadores_listar tool with filters (name, party, state, legislature)
  - Implement Zod schema for input validation
  - Add pagination support (pagina, itens parameters)
  - Implement API call to GET /senador/lista/{legislatura}
  - Format response as MCP tool result
  - _Requirements: 3.1_

- [ ] 5.2 Implement Senator Details Tool
  - Create senador_detalhes tool for individual senator lookup
  - Implement API call to GET /senador/{codigo}
  - Parse senator data including biography, contact, photo URL
  - Handle missing or incomplete data gracefully
  - _Requirements: 3.2_

- [ ] 5.3 Implement Senator Voting History Tool
  - Create senador_votacoes tool for voting records
  - Implement API call to GET /senador/{codigo}/votacoes
  - Add date range filters (dataInicio, dataFim)
  - Parse voting data with proposal references
  - _Requirements: 3.3_

- [ ] 5.4 Implement Senator Authorship Tool
  - Create senador_autorias tool for authored proposals
  - Implement API call to GET /senador/{codigo}/autorias
  - Add pagination and date filters
  - Parse proposal authorship data
  - _Requirements: 3.4_

- [ ] 5.5 Implement Senator Committee Membership Tool
  - Create senador_comissoes tool for committee memberships
  - Implement API call to GET /senador/{codigo}/comissoes
  - Parse committee membership data with roles and dates
  - _Requirements: 3.5_

- [ ] 5.6 Implement Additional Senator Tools
  - Create senador_licencas tool for leave records
  - Create senador_mandatos tool for mandate history
  - Create senador_liderancas tool for leadership positions
  - Create senador_cargos tool for positions held
  - Implement corresponding API calls and data parsing
  - _Requirements: 3.2, 3.3_

- [ ] 6. Proposal Tools Implementation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.1 Implement Proposal Search Tool
  - Create materias_pesquisar tool with advanced filters
  - Implement API call to GET /materia/pesquisa/lista
  - Add filters (type, year, author, status, keywords)
  - Implement pagination for large result sets
  - _Requirements: 4.1_

- [ ] 6.2 Implement Proposal Details Tool
  - Create materia_detalhes tool for individual proposal lookup
  - Implement API call to GET /materia/{codigo}
  - Parse proposal data including ementa, explicacao, situation
  - Include author information and proposal type
  - _Requirements: 4.2_

- [ ] 6.3 Implement Proposal Voting History Tool
  - Create materia_votacoes tool for proposal voting records
  - Implement API call to GET /materia/{codigo}/votacoes
  - Parse voting history with results and dates
  - _Requirements: 4.3_

- [ ] 6.4 Implement Proposal Processing History Tool
  - Create materia_tramitacoes tool for processing history
  - Implement API call to GET /materia/{codigo}/tramitacoes
  - Parse tramitação data with dates, origins, destinations
  - Show current status and processing flow
  - _Requirements: 4.5_

- [ ] 6.5 Implement Additional Proposal Tools
  - Create materia_textos tool for proposal texts
  - Create materia_autores tool for author details
  - Create materia_relacionadas tool for related proposals
  - Implement corresponding API calls and data parsing
  - _Requirements: 4.2, 4.4_

- [ ] 7. Voting Tools Implementation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.1 Implement Voting Session Listing Tool
  - Create votacoes_listar tool with date filters
  - Implement API call to GET /votacao/lista/{data}
  - Parse voting session list with basic information
  - Add pagination support
  - _Requirements: 5.1_

- [ ] 7.2 Implement Voting Details Tool
  - Create votacao_detalhes tool for individual voting session
  - Implement API call to GET /votacao/{codigo}
  - Parse voting details including result, type, totals
  - Include proposal reference if available
  - _Requirements: 5.2_

- [ ] 7.3 Implement Individual Votes Tool
  - Create votacao_votos tool for senator-level votes
  - Implement API call to GET /votacao/{codigo}/votos
  - Parse individual votes with senator, party, state information
  - Handle absent and abstention votes
  - _Requirements: 5.3_

- [ ] 7.4 Implement Party Orientation Tool
  - Create votacao_orientacoes tool for party voting guidance
  - Parse party leadership voting recommendations
  - Show party discipline metrics if available
  - _Requirements: 5.4_

- [ ] 8. Committee Tools Implementation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.1 Implement Committee Listing Tool
  - Create comissoes_listar tool with type filters
  - Implement API call to GET /comissao/lista
  - Parse committee list with basic information
  - Filter by type (permanent, temporary, mixed)
  - _Requirements: 6.1_

- [ ] 8.2 Implement Committee Details Tool
  - Create comissao_detalhes tool for individual committee
  - Implement API call to GET /comissao/{codigo}
  - Parse committee details including purpose, jurisdiction, dates
  - Show current status (active/inactive)
  - _Requirements: 6.2_

- [ ] 8.3 Implement Committee Membership Tool
  - Create comissao_membros tool for committee members
  - Implement API call to GET /comissao/{codigo}/membros
  - Parse member data with roles (president, vice, member, alternate)
  - Include senator party and state information
  - _Requirements: 6.3_

- [ ] 8.4 Implement Committee Meetings Tool
  - Create comissao_reunioes tool for meeting schedules
  - Implement API call to GET /comissao/{codigo}/reunioes
  - Parse meeting data with dates, locations, agendas
  - _Requirements: 6.4_

- [ ] 8.5 Implement Committee Proposals Tool
  - Create comissao_materias tool for proposals under review
  - Implement API call to GET /comissao/{codigo}/materias
  - Parse proposal list with current status in committee
  - _Requirements: 6.5_

- [ ] 9. Party and Bloc Tools Implementation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Implement Party Listing Tool
  - Create partidos_listar tool for all parties
  - Implement API call to GET /partido/lista
  - Parse party list with basic information
  - Show active and inactive parties
  - _Requirements: 7.1_

- [ ] 9.2 Implement Party Details Tool
  - Create partido_detalhes tool for individual party
  - Implement API call to GET /partido/{codigo}
  - Parse party details including leadership, foundation date
  - Show total number of senators
  - _Requirements: 7.2_

- [ ] 9.3 Implement Party Members Tool
  - Create partido_senadores tool for party senators
  - Implement API call to GET /partido/{codigo}/senadores
  - Parse senator list with current affiliations
  - _Requirements: 7.3_

- [ ] 9.4 Implement Parliamentary Bloc Listing Tool
  - Create blocos_listar tool for all blocs
  - Implement API call to GET /bloco/lista
  - Parse bloc list with member parties
  - Show active and inactive blocs
  - _Requirements: 7.4_

- [ ] 9.5 Implement Parliamentary Bloc Details Tool
  - Create bloco_detalhes tool for individual bloc
  - Implement API call to GET /bloco/{codigo}
  - Parse bloc composition with member parties
  - Show formation and dissolution dates
  - _Requirements: 7.5_

- [ ] 10. Reference Data Tools Implementation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10.1 Implement Legislature Listing Tool
  - Create legislaturas_listar tool for all legislative sessions
  - Implement API call to GET /legislatura/lista
  - Parse legislature data with start/end dates
  - _Requirements: 8.1_

- [ ] 10.2 Implement Proposal Type Reference Tool
  - Create tipos_materia_listar tool for proposal classifications
  - Implement API call to GET /tipoMateria/lista
  - Parse proposal types (PLS, PEC, PLP, etc.)
  - _Requirements: 8.2_

- [ ] 10.3 Implement Proposal Status Reference Tool
  - Create situacoes_materia_listar tool for status codes
  - Implement API call to GET /situacaoMateria/lista
  - Parse status descriptions and codes
  - _Requirements: 8.3_

- [ ] 10.4 Implement Committee Type Reference Tool
  - Create tipos_comissao_listar tool for committee classifications
  - Parse committee type descriptions
  - _Requirements: 8.4_

- [ ] 10.5 Implement State Reference Tool
  - Create ufs_listar tool for Brazilian states
  - Implement API call to GET /uf/lista
  - Parse state data with codes and names
  - Show Senate representation (3 senators per state)
  - _Requirements: 8.5_

- [ ] 11. Adapter Implementations
  - _Requirements: 1.2, 1.3, 10.1, 10.2, 10.3_

- [ ] 11.1 Implement CLI Adapter (Stdio Transport)
  - Create cli.ts adapter for stdio transport
  - Initialize SenadoServer with configuration
  - Connect to StdioServerTransport
  - Add graceful shutdown handling
  - _Requirements: 1.2, 10.1_

- [ ] 11.2 Implement HTTP Adapter (Express Server)
  - Create http.ts adapter with Express server
  - Implement /mcp endpoint for MCP protocol over HTTP
  - Implement REST endpoints (/senadores/{id}, /materias/{id}, etc.)
  - Add /health endpoint for monitoring
  - Implement SSE transport for streaming responses
  - Add CORS configuration
  - _Requirements: 1.3, 10.2_

- [ ] 11.3 Implement Cloudflare Workers Adapter
  - Create worker.ts for Cloudflare Workers deployment
  - Implement fetch handler for HTTP requests
  - Integrate KV storage for caching
  - Implement KV-based rate limiting
  - Add API key authentication for REST endpoints
  - Create OpenAPI specification endpoint
  - _Requirements: 10.3_

- [ ] 12. Security Implementation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12.1 Implement API Key Authentication
  - Create authentication middleware for REST endpoints
  - Validate X-API-Key and Authorization headers
  - Return 401 Unauthorized for invalid keys
  - Skip authentication for MCP protocol endpoints
  - _Requirements: 11.1, 11.2_

- [ ] 12.2 Implement CORS Protection
  - Configure CORS headers for HTTP endpoints
  - Allow specific origins or wildcard for public APIs
  - Set appropriate Access-Control headers
  - _Requirements: 11.3_

- [ ] 12.3 Implement Input Sanitization
  - Add string trimming and length validation
  - Validate numeric ranges and formats
  - Escape HTML/XML in outputs
  - Prevent injection attacks
  - _Requirements: 11.5_

- [ ] 12.4 Implement PII Masking
  - Create maskPII utility function
  - Mask names, emails, phone numbers in logs
  - Apply masking to all log outputs
  - _Requirements: 11.4_

- [ ] 13. Testing Implementation
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 13.1 Implement Core Component Unit Tests
  - Write tests for SenadoServer initialization and tool registration
  - Write tests for ToolRegistry operations
  - Write tests for input validation with Zod schemas
  - Write tests for error handling and transformation
  - Achieve minimum 70% code coverage
  - _Requirements: 13.1, 13.4_

- [ ] 13.2 Implement Infrastructure Unit Tests
  - Write tests for HTTP client with mock responses
  - Write tests for cache operations (get, set, delete, clear)
  - Write tests for circuit breaker state transitions
  - Write tests for rate limiter token bucket algorithm
  - Write tests for logger with different log levels
  - _Requirements: 13.1_

- [ ] 13.3 Implement Tool Unit Tests
  - Write tests for all senator tool handlers
  - Write tests for all proposal tool handlers
  - Write tests for all voting tool handlers
  - Write tests for all committee tool handlers
  - Write tests for all party tool handlers
  - Write tests for all reference tool handlers
  - Use mock HTTP client for isolated testing
  - _Requirements: 13.1_

- [ ] 13.4 Implement Integration Tests
  - Write integration tests for Senado API endpoints
  - Test error handling with real API error scenarios
  - Test caching behavior with real API calls
  - Test rate limiting with multiple requests
  - _Requirements: 13.2_

- [ ] 13.5 Implement End-to-End Tests
  - Write e2e tests for full MCP protocol flow
  - Test tool invocation from client perspective
  - Test stdio transport communication
  - Test HTTP transport communication
  - _Requirements: 13.3_

- [ ] 14. Documentation
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 14.1 Create README.md
  - Write project overview and features
  - Add installation instructions for NPM, NPX, Smithery
  - Document configuration for Claude Desktop, Cursor, Windsurf, Continue.dev
  - List all available tools with descriptions
  - Add quick start examples
  - Include troubleshooting section
  - _Requirements: 12.1_

- [ ] 14.2 Create API Documentation
  - Document all 50+ tools with input/output schemas
  - Provide example requests and responses
  - Document error codes and messages
  - Create tool reference organized by category
  - _Requirements: 12.2_

- [ ] 14.3 Create Configuration Documentation
  - Document all environment variables
  - Provide .env.example file
  - Document .mcprc.json format
  - Show configuration examples for common scenarios
  - _Requirements: 12.3_

- [ ] 14.4 Create Deployment Documentation
  - Write NPM package deployment guide
  - Write Cloudflare Workers deployment guide
  - Write Smithery deployment guide
  - Document environment setup for each platform
  - _Requirements: 12.1_

- [ ] 14.5 Create Usage Examples
  - Provide example prompts for common use cases
  - Show integration patterns with AI assistants
  - Document best practices for tool usage
  - _Requirements: 12.3_

- [ ] 14.6 Create Developer Documentation
  - Write architecture documentation
  - Document design patterns used
  - Create contributing guide
  - Write code style guide
  - _Requirements: 12.5_

- [ ] 15. Build and Deployment Setup
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15.1 Configure Build System
  - Set up TypeScript compilation to build/ directory
  - Configure source maps for debugging
  - Set up npm scripts (dev, build, start, test)
  - Configure package.json for NPM publishing
  - _Requirements: 10.1_

- [ ] 15.2 Configure NPM Package
  - Set package name (@aredes.me/mcp-senado)
  - Configure bin entry point (mcp-senado)
  - Set up files array for package contents
  - Add keywords for discoverability
  - Configure repository and author information
  - _Requirements: 10.1_

- [ ] 15.3 Configure Cloudflare Workers
  - Create wrangler.toml configuration
  - Set up KV namespace bindings
  - Configure environment variables
  - Set up deployment scripts (dev, staging, production)
  - _Requirements: 10.3_

- [ ] 15.4 Configure Smithery
  - Create smithery.yaml configuration
  - Define installation method (NPM)
  - Configure environment variables
  - List supported clients
  - _Requirements: 10.3_

- [ ] 15.5 Set Up CI/CD
  - Configure GitHub Actions for automated testing
  - Set up automated NPM publishing on release
  - Configure Cloudflare Workers deployment
  - Add code quality checks (linting, type checking)
  - _Requirements: 10.5_

- [ ] 16. Final Integration and Testing
  - _Requirements: 13.5, 14.1_

- [ ] 16.1 Integration Testing with AI Assistants
  - Test with Claude Desktop using stdio transport
  - Test with Cursor IDE
  - Test with Windsurf IDE
  - Test with Continue.dev
  - Verify all tools work correctly in each client
  - _Requirements: 13.5_

- [ ] 16.2 Performance Testing
  - Test cache hit rates with realistic workloads
  - Measure response times for all tools
  - Test rate limiting under load
  - Verify circuit breaker behavior under failures
  - _Requirements: 13.2_

- [ ] 16.3 Documentation Review
  - Review all documentation for accuracy
  - Test all code examples
  - Verify installation instructions
  - Check for broken links
  - _Requirements: 14.1_

- [ ] 16.4 Final Code Review
  - Review code for consistency with design patterns
  - Check error handling coverage
  - Verify logging is comprehensive
  - Ensure security best practices are followed
  - _Requirements: 12.5_

- [ ] 16.5 Prepare for Release
  - Update version numbers
  - Write release notes
  - Create GitHub release
  - Publish to NPM
  - Deploy to Cloudflare Workers
  - Submit to Smithery
  - _Requirements: 10.1, 10.3_

## Notes

- Each task includes references to the requirements it addresses
- Tasks are designed to be completed incrementally, with each building on previous work
- The implementation follows the proven patterns from mcp-camara and mcp-dadosbr
- XML parsing for Senado API responses is a key difference from the Camara implementation
- All tools should be tested individually before integration testing
