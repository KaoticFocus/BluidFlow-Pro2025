/**
 * Structured Logging
 * Provides consistent logging format with context
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  correlationId?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext = {};

  /**
   * Set default context for all logs
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Format log message
   */
  private format(level: LogLevel, message: string, extra?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...extra,
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Log debug message
   */
  debug(message: string, extra?: Record<string, any>) {
    if (process.env.NODE_ENV === "development" || process.env.LOG_LEVEL === "debug") {
      console.debug(this.format(LogLevel.DEBUG, message, extra));
    }
  }

  /**
   * Log info message
   */
  info(message: string, extra?: Record<string, any>) {
    console.log(this.format(LogLevel.INFO, message, extra));
  }

  /**
   * Log warning message
   */
  warn(message: string, extra?: Record<string, any>) {
    console.warn(this.format(LogLevel.WARN, message, extra));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, extra?: Record<string, any>) {
    const errorContext: Record<string, any> = {
      ...extra,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    } else if (error) {
      errorContext.error = String(error);
    }

    console.error(this.format(LogLevel.ERROR, message, errorContext));
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a logger with context
 */
export function createLogger(context: LogContext): Logger {
  const contextLogger = new Logger();
  contextLogger.setContext(context);
  return contextLogger;
}

