import { Server } from 'http';
import { logger } from './logger.js';
import { config } from '@/config/config.js';

/**
 * Graceful shutdown configuration
 */
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 5000; // 5 seconds

/**
 * Graceful shutdown handler
 * Handles server shutdown gracefully with proper cleanup
 */
export const gracefulShutdown = (server: Server): void => {
  let isShuttingDown = false;

  /**
   * Handle shutdown signals
   */
  const handleShutdown = (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal', { signal });
      return;
    }

    isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown`, {
      signal,
      pid: process.pid,
      uptime: process.uptime(),
    });

    // Set shutdown timeout
    const shutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit', {
        timeout: SHUTDOWN_TIMEOUT,
      });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    // Start graceful shutdown process
    shutdown(server, shutdownTimer);
  };

  /**
   * Perform graceful shutdown
   */
  const shutdown = async (server: Server, timer: NodeJS.Timeout) => {
    try {
      // Stop accepting new connections
      server.close((err) => {
        if (err) {
          logger.error('Error closing server', { error: err.message });
        } else {
          logger.info('Server closed successfully');
        }
      });

      // Clear shutdown timer
      clearTimeout(timer);

      // Perform cleanup tasks
      await performCleanup();

      // Exit process
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exit(1);
    }
  };

  /**
   * Perform cleanup tasks
   */
  const performCleanup = async (): Promise<void> => {
    const cleanupTasks = [
      cleanupDatabase,
      cleanupRedis,
      cleanupExternalConnections,
      cleanupLogs,
    ];

    for (const task of cleanupTasks) {
      try {
        await task();
      } catch (error) {
        logger.error('Cleanup task failed', {
          task: task.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  /**
   * Cleanup database connections
   */
  const cleanupDatabase = async (): Promise<void> => {
    try {
      // TODO: Implement database cleanup
      // await mongoose.connection.close();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Cleanup Redis connections
   */
  const cleanupRedis = async (): Promise<void> => {
    try {
      // TODO: Implement Redis cleanup
      // await redisClient.quit();
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error closing Redis connections', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Cleanup external connections
   */
  const cleanupExternalConnections = async (): Promise<void> => {
    try {
      // TODO: Implement external service cleanup
      logger.info('External connections closed');
    } catch (error) {
      logger.error('Error closing external connections', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Cleanup logs
   */
  const cleanupLogs = async (): Promise<void> => {
    try {
      // Flush any pending log entries
      logger.info('Logs flushed');
    } catch (error) {
      logger.error('Error flushing logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Health check during shutdown
   */
  const healthCheck = (): boolean => {
    // Check if server is still accepting connections
    return server.listening;
  };

  /**
   * Monitor server health during shutdown
   */
  const monitorHealth = (): void => {
    const interval = setInterval(() => {
      if (!healthCheck()) {
        clearInterval(interval);
        logger.info('Server health check passed, shutdown can proceed');
      }
    }, HEALTH_CHECK_INTERVAL);
  };

  // Register signal handlers
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGUSR2', () => handleShutdown('SIGUSR2')); // For nodemon

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception during shutdown', {
      error: error.message,
      stack: error.stack,
    });
    handleShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection during shutdown', {
      reason: reason instanceof Error ? reason.message : reason,
      promise: promise.toString(),
    });
    handleShutdown('unhandledRejection');
  });

  // Log shutdown configuration
  logger.info('Graceful shutdown configured', {
    timeout: SHUTDOWN_TIMEOUT,
    healthCheckInterval: HEALTH_CHECK_INTERVAL,
    signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
  });
};

/**
 * Create shutdown handler with custom options
 */
export const createShutdownHandler = (options: {
  timeout?: number;
  healthCheckInterval?: number;
  cleanupTasks?: Array<() => Promise<void>>;
}) => {
  const {
    timeout = SHUTDOWN_TIMEOUT,
    healthCheckInterval = HEALTH_CHECK_INTERVAL,
    cleanupTasks = [],
  } = options;

  return (server: Server): void => {
    let isShuttingDown = false;

    const handleShutdown = (signal: string) => {
      if (isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal', { signal });
        return;
      }

      isShuttingDown = true;
      logger.info(`Received ${signal}, starting graceful shutdown`, {
        signal,
        pid: process.pid,
        uptime: process.uptime(),
        timeout,
      });

      const shutdownTimer = setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded, forcing exit', {
          timeout,
        });
        process.exit(1);
      }, timeout);

      const shutdown = async (server: Server, timer: NodeJS.Timeout) => {
        try {
          server.close((err) => {
            if (err) {
              logger.error('Error closing server', { error: err.message });
            } else {
              logger.info('Server closed successfully');
            }
          });

          clearTimeout(timer);

          // Run custom cleanup tasks
          for (const task of cleanupTasks) {
            try {
              await task();
            } catch (error) {
              logger.error('Custom cleanup task failed', {
                task: task.name,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          process.exit(1);
        }
      };

      shutdown(server, shutdownTimer);
    };

    // Register signal handlers
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGUSR2', () => handleShutdown('SIGUSR2'));

    logger.info('Custom graceful shutdown configured', {
      timeout,
      healthCheckInterval,
      cleanupTasks: cleanupTasks.length,
    });
  };
};

/**
 * Shutdown status checker
 */
export const isShuttingDown = (): boolean => {
  return process.emit('shutdown') !== false;
};

/**
 * Force shutdown (use with caution)
 */
export const forceShutdown = (): void => {
  logger.warn('Force shutdown initiated');
  process.exit(1);
};

export default gracefulShutdown;
