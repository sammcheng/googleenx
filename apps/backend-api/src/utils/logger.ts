import winston from 'winston';
import path from 'path';
import { config } from '@/config/config.js';

/**
 * Custom log format for structured logging
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...meta,
    };
    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'food-price-comparison-api',
    version: '1.0.0',
  },
  transports: [],
  exitOnError: false,
});

/**
 * Add console transport for development
 */
if (config.logging.console.enabled) {
  logger.add(new winston.transports.Console({
    format: config.server.nodeEnv === 'development' ? consoleFormat : logFormat,
    level: config.logging.level,
  }));
}

/**
 * Add file transport for production
 */
if (config.logging.file.enabled) {
  // Ensure logs directory exists
  const logsDir = path.dirname(config.logging.file.filename);
  
  logger.add(new winston.transports.File({
    filename: config.logging.file.filename,
    level: config.logging.level,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: config.logging.file.maxFiles,
    format: logFormat,
  }));

  // Add error log file
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: config.logging.file.maxFiles,
    format: logFormat,
  }));
}

/**
 * Create child logger with additional metadata
 */
export const createChildLogger = (meta: Record<string, any>) => {
  return logger.child(meta);
};

/**
 * Log levels and their numeric values
 */
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

/**
 * Custom log methods for common use cases
 */
export const loggers = {
  /**
   * Log HTTP requests
   */
  http: (req: any, res: any, responseTime: number) => {
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      referer: req.get('Referer'),
    });
  },

  /**
   * Log database operations
   */
  database: (operation: string, collection: string, duration?: number, error?: Error) => {
    if (error) {
      logger.error('Database Error', {
        operation,
        collection,
        error: error.message,
        stack: error.stack,
        duration: duration ? `${duration}ms` : undefined,
      });
    } else {
      logger.info('Database Operation', {
        operation,
        collection,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  },

  /**
   * Log external API calls
   */
  api: (service: string, endpoint: string, method: string, statusCode: number, duration?: number, error?: Error) => {
    if (error) {
      logger.error('External API Error', {
        service,
        endpoint,
        method,
        statusCode,
        error: error.message,
        stack: error.stack,
        duration: duration ? `${duration}ms` : undefined,
      });
    } else {
      logger.info('External API Call', {
        service,
        endpoint,
        method,
        statusCode,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  },

  /**
   * Log security events
   */
  security: (event: string, details: Record<string, any>) => {
    logger.warn('Security Event', {
      event,
      ...details,
    });
  },

  /**
   * Log performance metrics
   */
  performance: (metric: string, value: number, unit: string = 'ms') => {
    logger.info('Performance Metric', {
      metric,
      value,
      unit,
    });
  },

  /**
   * Log business events
   */
  business: (event: string, details: Record<string, any>) => {
    logger.info('Business Event', {
      event,
      ...details,
    });
  },
};

/**
 * Error logging with stack trace
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    loggers.http(req, res, duration);
  });
  
  next();
};

/**
 * Unhandled exception and rejection handlers
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
  process.exit(1);
});

export default logger;
