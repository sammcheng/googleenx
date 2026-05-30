import { Router } from 'express';
import type { Request, Response } from 'express';
import os from 'node:os';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger.js';
import { config } from '@/config/config.js';

const router = Router();

/**
 * Health check endpoint
 * Returns server status and system information
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv,
      version: '1.0.0',
      requestId: req.id,
    };

    // Add system information
    const systemInfo = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
      },
      platform: process.platform,
      nodeVersion: process.version,
    };

    // Add database health (if configured)
    const databaseHealth = await checkDatabaseHealth();
    
    // Add external service health (if configured)
    const externalHealth = await checkExternalServicesHealth();

    const response = {
      ...health,
      system: systemInfo,
      services: {
        database: databaseHealth,
        external: externalHealth,
      },
      responseTime: `${Date.now() - startTime}ms`,
    };

    // Log health check
    logger.info('Health check performed', {
      requestId: req.id,
      responseTime: Date.now() - startTime,
      status: 'healthy',
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Health check failed', {
      requestId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      requestId: req.id,
      responseTime: `${Date.now() - startTime}ms`,
    });
  }
});

/**
 * Detailed health check endpoint
 * Returns comprehensive system status
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv,
      version: '1.0.0',
      requestId: req.id,
      
      // System metrics
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: process.platform !== 'win32' ? os.loadavg() : undefined,
        },
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        arch: process.arch,
      },
      
      // Service health
      services: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        external: await checkExternalServicesHealth(),
      },
      
      // Configuration
      config: {
        cors: {
          allowedOrigins: config.cors.allowedOrigins.length,
        },
        rateLimit: {
          windowMs: config.rateLimit.windowMs,
          max: config.rateLimit.max,
        },
        logging: {
          level: config.logging.level,
          fileEnabled: config.logging.file.enabled,
          consoleEnabled: config.logging.console.enabled,
        },
      },
      
      responseTime: `${Date.now() - startTime}ms`,
    };

    res.status(200).json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check failed', {
      requestId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      requestId: req.id,
      responseTime: `${Date.now() - startTime}ms`,
    });
  }
});

/**
 * Readiness probe endpoint
 * Used by Kubernetes/Docker for readiness checks
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all required services are ready
    const databaseReady = await checkDatabaseHealth();
    const redisReady = await checkRedisHealth();

    if (isServiceReady(databaseReady.status) && isServiceReady(redisReady.status)) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: databaseReady,
          redis: redisReady,
        },
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          database: databaseReady,
          redis: redisReady,
        },
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', {
      requestId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
    });
  }
});

/**
 * Liveness probe endpoint
 * Used by Kubernetes/Docker for liveness checks
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<{ status: string; message?: string; responseTime?: string }> {
  const startTime = Date.now();

  if (!config.services.persistence.mongodbEnabled) {
    return {
      status: 'disabled',
      message: 'MongoDB is disabled for this environment',
      responseTime: `${Date.now() - startTime}ms`,
    };
  }

  try {
    const readyState = mongoose.connection.readyState;
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    if (readyState !== 1) {
      return {
        status: config.services.persistence.mongodbRequired ? 'unhealthy' : 'degraded',
        message: `MongoDB is ${stateMap[readyState] || 'unknown'}`,
        responseTime: `${Date.now() - startTime}ms`,
      };
    }

    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime: `${Date.now() - startTime}ms`,
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedisHealth(): Promise<{ status: string; message?: string; responseTime?: string }> {
  const startTime = Date.now();

  if (!config.services.persistence.redisEnabled) {
    return {
      status: 'disabled',
      message: 'Redis is disabled for this environment',
      responseTime: `${Date.now() - startTime}ms`,
    };
  }

  try {
    return {
      status: config.services.persistence.redisRequired ? 'unhealthy' : 'degraded',
      message: 'Redis health checks are not configured yet',
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis connection failed',
      responseTime: `${Date.now() - startTime}ms`,
    };
  }
}

/**
 * Check external services health
 */
async function checkExternalServicesHealth(): Promise<{ status: string; services: any }> {
  try {
    const googleMapsConfigured = Boolean(config.external.googleMaps.apiKey);
    const openWeatherConfigured = Boolean(config.external.openWeather.apiKey);

    return {
      status: googleMapsConfigured || openWeatherConfigured ? 'healthy' : 'disabled',
      services: {
        googleMaps: {
          status: googleMapsConfigured ? 'configured' : 'disabled',
          message: googleMapsConfigured ? 'API key configured' : 'API key not configured',
        },
        openWeather: {
          status: openWeatherConfigured ? 'configured' : 'disabled',
          message: openWeatherConfigured ? 'API key configured' : 'API key not configured',
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      services: {
        googleMaps: { status: 'unhealthy', message: 'API not accessible' },
        openWeather: { status: 'unhealthy', message: 'API not accessible' },
      },
    };
  }
}

function isServiceReady(status: string): boolean {
  return status === 'healthy' || status === 'disabled';
}

export { router as healthRouter };
