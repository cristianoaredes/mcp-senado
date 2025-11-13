/**
 * MCP Senado Federal - Main Export File
 */

// Configuration
export { loadConfig, getDefaultConfig } from './config/config.js';

// Infrastructure
export { createLogger } from './infrastructure/logger.js';
export { createHttpClient, SenadoAPIError } from './infrastructure/http-client.js';
export { createCache, LRUCache, NoOpCache } from './infrastructure/cache.js';
export { createCircuitBreaker, CircuitBreakerError } from './infrastructure/circuit-breaker.js';
export { createRateLimiter, RateLimitError } from './infrastructure/rate-limiter.js';

// Core
export { createToolRegistry, ToolRegistry } from './core/tools.js';
export { createMCPServer, SenadoMCPServer } from './core/mcp-server.js';
export {
  ValidationError,
  ToolNotFoundError,
  ConfigurationError,
  errorToToolResult,
  isRetriableError,
} from './core/errors.js';
export {
  validateToolInput,
  zodToJsonSchema,
  // Export common schemas
  PaginationSchema,
  DateRangeSchema,
  CodeSchema,
  LegislatureSchema,
  UFSchema,
} from './core/validation.js';

// Types
export type * from './types/index.js';
