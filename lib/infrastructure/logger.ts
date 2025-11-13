/**
 * Structured Logger with PII Masking
 *
 * Features:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Structured logging with context objects
 * - PII masking for sensitive data
 * - JSON and text output formats
 * - Specialized logging methods
 */

import type { Logger, LogLevel, LogEntry } from '../types/index.js';
import { LogLevel as Level } from '../types/index.js';

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  maskPII: boolean;
}

export class StructuredLogger implements Logger {
  private readonly config: LoggerConfig;
  private readonly levelPriority: Record<LogLevel, number> = {
    [Level.DEBUG]: 0,
    [Level.INFO]: 1,
    [Level.WARN]: 2,
    [Level.ERROR]: 3,
  };

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(Level.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(Level.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(Level.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log(Level.ERROR, message, errorContext);
  }

  /**
   * Log tool invocation
   */
  logToolInvocation(
    toolName: string,
    args: unknown,
    duration: number
  ): void {
    this.info('Tool invocation', {
      tool: toolName,
      args: this.config.maskPII ? this.maskSensitiveData(args) : args,
      duration,
    });
  }

  /**
   * Log cache hit
   */
  logCacheHit(key: string): void {
    this.debug('Cache hit', { key });
  }

  /**
   * Log cache miss
   */
  logCacheMiss(key: string): void {
    this.debug('Cache miss', { key });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    // Check if message should be logged based on level
    if (
      this.levelPriority[level] < this.levelPriority[this.config.level]
    ) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context
        ? this.config.maskPII
          ? this.maskSensitiveData(context)
          : context
        : undefined,
    };

    // Output log entry
    this.output(entry);
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (this.config.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      // Text format
      const timestamp = entry.timestamp;
      const level = entry.level.padEnd(5);
      const message = entry.message;

      let output = `${timestamp} [${level}] ${message}`;

      if (entry.context) {
        output += ` ${JSON.stringify(entry.context)}`;
      }

      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }

      // Use appropriate console method based on level
      switch (entry.level) {
        case Level.ERROR:
          console.error(output);
          break;
        case Level.WARN:
          console.warn(output);
          break;
        case Level.DEBUG:
          console.debug(output);
          break;
        default:
          console.log(output);
      }
    }
  }

  /**
   * Mask sensitive data (PII)
   */
  private maskSensitiveData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    const masked: Record<string, unknown> = {};
    const sensitiveKeys = [
      'email',
      'telefone',
      'phone',
      'cpf',
      'cnpj',
      'password',
      'senha',
      'token',
      'apiKey',
      'api_key',
      'authorization',
    ];

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>
    )) {
      const lowerKey = key.toLowerCase();

      // Check if key is sensitive
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively mask nested objects
        masked[key] = this.maskSensitiveData(value);
      } else if (typeof value === 'string') {
        // Mask strings that look like emails or phones
        if (this.looksLikeEmail(value)) {
          masked[key] = this.maskEmail(value);
        } else if (this.looksLikePhone(value)) {
          masked[key] = this.maskPhone(value);
        } else {
          masked[key] = value;
        }
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Check if string looks like an email
   */
  private looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /**
   * Check if string looks like a phone number
   */
  private looksLikePhone(value: string): boolean {
    // Brazilian phone patterns
    return /^[\d\s\-\(\)]{10,}$/.test(value);
  }

  /**
   * Mask email address
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '[REDACTED]';

    const maskedLocal =
      local.length > 2
        ? `${local[0]}***${local[local.length - 1]}`
        : '***';

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  private maskPhone(phone: string): string {
    // Keep first 2 and last 2 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return '[REDACTED]';

    return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }
}

/**
 * Factory function to create logger
 */
export function createLogger(config: LoggerConfig): Logger {
  return new StructuredLogger(config);
}
