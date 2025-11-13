/**
 * Configuration Management
 *
 * Loads configuration from:
 * 1. Environment variables (.env file)
 * 2. .mcprc.json file
 * 3. Default values
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { MCPServerConfig } from '../types/index.js';
import { LogLevel } from '../types/index.js';

// Load environment variables from .env file
loadEnv();

/**
 * Load configuration from environment and files
 */
export function loadConfig(): MCPServerConfig {
  // Try to load from .mcprc.json first
  const mcprcConfig = loadMcprcFile();

  // Build configuration with precedence: env > mcprc > defaults
  const config: MCPServerConfig = {
    // Server
    name:
      process.env.MCP_SERVER_NAME ||
      mcprcConfig?.name ||
      'mcp-senado',
    version:
      process.env.MCP_SERVER_VERSION ||
      mcprcConfig?.version ||
      '1.0.0',
    transport:
      (process.env.MCP_TRANSPORT as 'stdio' | 'http') ||
      (mcprcConfig?.transport as 'stdio' | 'http') ||
      'stdio',

    // HTTP Server
    httpPort:
      parseInt(process.env.MCP_HTTP_PORT || '', 10) ||
      mcprcConfig?.httpPort ||
      3000,
    httpHost:
      process.env.MCP_HTTP_HOST ||
      mcprcConfig?.httpHost ||
      '0.0.0.0',

    // Senado API
    apiBaseUrl:
      process.env.SENADO_API_BASE_URL ||
      mcprcConfig?.apiBaseUrl ||
      'https://legis.senado.leg.br/dadosabertos',
    apiTimeout:
      parseInt(process.env.SENADO_API_TIMEOUT || '', 10) ||
      mcprcConfig?.apiTimeout ||
      30000,
    apiMaxRetries:
      parseInt(process.env.SENADO_API_MAX_RETRIES || '', 10) ||
      mcprcConfig?.apiMaxRetries ||
      3,
    apiRetryDelay:
      parseInt(process.env.SENADO_API_RETRY_DELAY || '', 10) ||
      mcprcConfig?.apiRetryDelay ||
      1000,

    // Cache
    cacheEnabled:
      parseBool(process.env.MCP_CACHE_ENABLED) ??
      mcprcConfig?.cacheEnabled ??
      true,
    cacheTTL:
      parseInt(process.env.MCP_CACHE_TTL || '', 10) ||
      mcprcConfig?.cacheTTL ||
      300000, // 5 minutes
    cacheMaxSize:
      parseInt(process.env.MCP_CACHE_MAX_SIZE || '', 10) ||
      mcprcConfig?.cacheMaxSize ||
      1000,
    cacheCleanupInterval:
      parseInt(process.env.MCP_CACHE_CLEANUP_INTERVAL || '', 10) ||
      mcprcConfig?.cacheCleanupInterval ||
      60000, // 1 minute

    // Rate Limiting
    rateLimitEnabled:
      parseBool(process.env.MCP_RATE_LIMIT_ENABLED) ??
      mcprcConfig?.rateLimitEnabled ??
      true,
    rateLimitTokens:
      parseInt(process.env.MCP_RATE_LIMIT_TOKENS || '', 10) ||
      mcprcConfig?.rateLimitTokens ||
      30,
    rateLimitInterval:
      parseInt(process.env.MCP_RATE_LIMIT_INTERVAL || '', 10) ||
      mcprcConfig?.rateLimitInterval ||
      60000, // 1 minute
    rateLimitRefillRate:
      parseInt(process.env.MCP_RATE_LIMIT_REFILL_RATE || '', 10) ||
      mcprcConfig?.rateLimitRefillRate ||
      2000, // 2 seconds

    // Circuit Breaker
    circuitBreakerEnabled:
      parseBool(process.env.MCP_CIRCUIT_BREAKER_ENABLED) ??
      mcprcConfig?.circuitBreakerEnabled ??
      true,
    circuitBreakerFailureThreshold:
      parseInt(
        process.env.MCP_CIRCUIT_BREAKER_FAILURE_THRESHOLD || '',
        10
      ) ||
      mcprcConfig?.circuitBreakerFailureThreshold ||
      5,
    circuitBreakerSuccessThreshold:
      parseInt(
        process.env.MCP_CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '',
        10
      ) ||
      mcprcConfig?.circuitBreakerSuccessThreshold ||
      2,
    circuitBreakerTimeout:
      parseInt(process.env.MCP_CIRCUIT_BREAKER_TIMEOUT || '', 10) ||
      mcprcConfig?.circuitBreakerTimeout ||
      60000, // 1 minute

    // Logging
    logLevel:
      parseLogLevel(process.env.MCP_LOG_LEVEL) ||
      mcprcConfig?.logLevel ||
      LogLevel.INFO,
    logFormat:
      (process.env.MCP_LOG_FORMAT as 'json' | 'text') ||
      (mcprcConfig?.logFormat as 'json' | 'text') ||
      'json',
    logMaskPII:
      parseBool(process.env.MCP_LOG_MASK_PII) ??
      mcprcConfig?.logMaskPII ??
      true,

    // Security
    apiKey: process.env.MCP_API_KEY || mcprcConfig?.apiKey,
    corsEnabled:
      parseBool(process.env.MCP_CORS_ENABLED) ??
      mcprcConfig?.corsEnabled ??
      true,
    corsOrigins:
      process.env.MCP_CORS_ORIGINS ||
      mcprcConfig?.corsOrigins ||
      '*',

    // Environment
    nodeEnv:
      (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
      (mcprcConfig?.nodeEnv as 'development' | 'production' | 'test') ||
      'production',
    debug:
      parseBool(process.env.DEBUG) ?? mcprcConfig?.debug ?? false,
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Load configuration from .mcprc.json file
 */
function loadMcprcFile(): Partial<MCPServerConfig> | null {
  const mcprcPath = resolve(process.cwd(), '.mcprc.json');

  if (!existsSync(mcprcPath)) {
    return null;
  }

  try {
    const content = readFileSync(mcprcPath, 'utf-8');
    return JSON.parse(content) as Partial<MCPServerConfig>;
  } catch (error) {
    console.warn(
      `Failed to load .mcprc.json: ${(error as Error).message}`
    );
    return null;
  }
}

/**
 * Parse boolean from string
 */
function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const lower = value.toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'yes') {
    return true;
  }
  if (lower === 'false' || lower === '0' || lower === 'no') {
    return false;
  }

  return undefined;
}

/**
 * Parse log level from string
 */
function parseLogLevel(value: string | undefined): LogLevel | undefined {
  if (!value) {
    return undefined;
  }

  const upper = value.toUpperCase();
  if (Object.values(LogLevel).includes(upper as LogLevel)) {
    return upper as LogLevel;
  }

  return undefined;
}

/**
 * Validate configuration
 */
function validateConfig(config: MCPServerConfig): void {
  const errors: string[] = [];

  // Validate required fields
  if (!config.name) {
    errors.push('Server name is required');
  }

  if (!config.version) {
    errors.push('Server version is required');
  }

  if (!config.apiBaseUrl) {
    errors.push('API base URL is required');
  }

  // Validate numeric ranges
  if (config.apiTimeout <= 0) {
    errors.push('API timeout must be positive');
  }

  if (config.apiMaxRetries < 0) {
    errors.push('API max retries must be non-negative');
  }

  if (config.cacheTTL <= 0) {
    errors.push('Cache TTL must be positive');
  }

  if (config.cacheMaxSize <= 0) {
    errors.push('Cache max size must be positive');
  }

  if (config.rateLimitTokens <= 0) {
    errors.push('Rate limit tokens must be positive');
  }

  if (config.rateLimitInterval <= 0) {
    errors.push('Rate limit interval must be positive');
  }

  if (config.circuitBreakerFailureThreshold <= 0) {
    errors.push('Circuit breaker failure threshold must be positive');
  }

  if (config.circuitBreakerSuccessThreshold <= 0) {
    errors.push('Circuit breaker success threshold must be positive');
  }

  if (config.circuitBreakerTimeout <= 0) {
    errors.push('Circuit breaker timeout must be positive');
  }

  if (config.transport === 'http' && config.httpPort <= 0) {
    errors.push('HTTP port must be positive');
  }

  // Throw if any errors
  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}`
    );
  }
}

/**
 * Get default configuration (for testing)
 */
export function getDefaultConfig(): MCPServerConfig {
  return {
    name: 'mcp-senado',
    version: '1.0.0',
    transport: 'stdio',
    httpPort: 3000,
    httpHost: '0.0.0.0',
    apiBaseUrl: 'https://legis.senado.leg.br/dadosabertos',
    apiTimeout: 30000,
    apiMaxRetries: 3,
    apiRetryDelay: 1000,
    cacheEnabled: true,
    cacheTTL: 300000,
    cacheMaxSize: 1000,
    cacheCleanupInterval: 60000,
    rateLimitEnabled: true,
    rateLimitTokens: 30,
    rateLimitInterval: 60000,
    rateLimitRefillRate: 2000,
    circuitBreakerEnabled: true,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerSuccessThreshold: 2,
    circuitBreakerTimeout: 60000,
    logLevel: LogLevel.INFO,
    logFormat: 'json',
    logMaskPII: true,
    corsEnabled: true,
    corsOrigins: '*',
    nodeEnv: 'production',
    debug: false,
  };
}
