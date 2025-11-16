/**
 * Shared types for MCP Senado Federal
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  headers?: Record<string, string>;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  endpoint?: string;
  details?: unknown;
}

// ============================================================================
// MCP Tool Types
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
  handler: (args: unknown, context: ToolContext) => Promise<ToolResult>;
  category: string;
}

export interface ToolContext {
  httpClient: HttpClient;
  cache: CacheInterface;
  config: MCPServerConfig;
  logger: Logger;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// ============================================================================
// HTTP Client Interface
// ============================================================================

export interface HttpClient {
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>>;
}

export interface HttpClientConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

// ============================================================================
// Cache Interface
// ============================================================================

export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  generateKey(prefix: string, params: Record<string, unknown>): string;
  getStats(): CacheStats;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ============================================================================
// Circuit Breaker Interface
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): CircuitState;
  getStats(): CircuitBreakerStats;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

// ============================================================================
// Rate Limiter Interface
// ============================================================================

export interface RateLimiter {
  checkLimit(): Promise<boolean>;
  getStats(): RateLimiterStats;
}

export interface RateLimiterStats {
  tokens: number;
  maxTokens: number;
  refillRate: number;
  lastRefillTime: number;
}

export interface RateLimiterConfig {
  tokens: number;
  interval: number;
  refillRate: number;
}

// ============================================================================
// Logger Interface
// ============================================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  logToolInvocation(toolName: string, args: unknown, duration: number): void;
  logCacheHit(key: string): void;
  logCacheMiss(key: string): void;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface MCPServerConfig {
  // Server
  name: string;
  version: string;
  transport: 'stdio' | 'http';

  // HTTP Server (when transport=http)
  httpPort: number;
  httpHost: string;

  // Senado API
  apiBaseUrl: string;
  apiTimeout: number;
  apiMaxRetries: number;
  apiRetryDelay: number;

  // Cache
  cacheEnabled: boolean;
  cacheTTL: number;
  cacheMaxSize: number;
  cacheCleanupInterval: number;

  // Rate Limiting
  rateLimitEnabled: boolean;
  rateLimitTokens: number;
  rateLimitInterval: number;
  rateLimitRefillRate: number;

  // Circuit Breaker
  circuitBreakerEnabled: boolean;
  circuitBreakerFailureThreshold: number;
  circuitBreakerSuccessThreshold: number;
  circuitBreakerTimeout: number;

  // Logging
  logLevel: LogLevel;
  logFormat: 'json' | 'text';
  logMaskPII: boolean;

  // Security
  apiKey?: string;
  corsEnabled: boolean;
  corsOrigins: string;

  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  debug: boolean;
}

// ============================================================================
// Senado API Data Models
// ============================================================================

export interface Senator {
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

export interface Proposal {
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

export interface Voting {
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

export interface Committee {
  codigo: number;
  sigla: string;
  nome: string;
  descricao?: string;
  tipo: string;
  dataInicio?: string;
  dataFim?: string;
  situacao: string;
}

export interface Party {
  codigo: number;
  sigla: string;
  nome: string;
  dataFundacao?: string;
  totalSenadores: number;
}

export interface Legislature {
  numero: number;
  dataInicio: string;
  dataFim: string;
  descricao?: string;
}

// ============================================================================
// Service Metadata
// ============================================================================

export interface ServiceInfo {
  name: string;
  description: string;
  version: string;
  environment: string;
  documentationUrl: string;
  repositoryUrl: string;
}

// ============================================================================
// MCP HTTP Transport Types
// ============================================================================

export interface MCPTransportRequest {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: unknown;
}

export interface MCPTransportError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPTransportResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: unknown;
  error?: MCPTransportError;
}
