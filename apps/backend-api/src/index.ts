import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from '@/utils/logger.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { notFoundHandler } from '@/middleware/notFoundHandler.js';
import { rateLimiter } from '@/middleware/rateLimiter.js';
import { requestValidator } from '@/middleware/requestValidator.js';
import { healthRouter } from '@/routes/health.js';
import { apiRouter } from '@/routes/api.js';
import { gracefulShutdown } from '@/utils/gracefulShutdown.js';
import { config, validateConfig } from '@/config/config.js';
import { connectDatabase } from '@/config/database.js';

// Load environment variables
dotenv.config();

const ORIGIN_WILDCARDS = config.cors.allowedOrigins.map(pattern => wildcardToRegExp(pattern));

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function isAllowedOrigin(origin: string): boolean {
  return ORIGIN_WILDCARDS.some(pattern => pattern.test(origin));
}

/**
 * Production-ready Express.js server with TypeScript
 * Features: CORS, Helmet, Rate Limiting, Zod Validation, Winston Logging
 */
class Server {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware for the Express application
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration for Chrome extension origins
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        logger.warn('Blocked request from disallowed origin', { origin });
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400, // 24 hours
    }));

    // Compression middleware
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // Request logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true,
      type: 'application/json'
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 1000
    }));

    // Request validation middleware
    this.app.use(requestValidator);

    // Rate limiting
    this.app.use(rateLimiter);

    // Trust proxy (for rate limiting behind reverse proxy)
    this.app.set('trust proxy', 1);
  }

  /**
   * Setup routes for the Express application
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.use('/health', healthRouter);

    // API routes
    this.app.use('/api/v1', apiRouter);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Food Price Comparison API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
      });
    });

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'Food Price Comparison API',
        version: '1.0.0',
        description: 'Production-ready API for food price comparison Chrome extension',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          documentation: '/docs'
        },
        features: [
          'CORS for Chrome extension origins',
          'Helmet security middleware',
          'Rate limiting',
          'Request validation with Zod',
          'Structured logging with Winston',
          'Health check endpoint',
          'Error handling middleware',
          'Graceful shutdown'
        ]
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      validateConfig();

      const databaseConnected = await connectDatabase();
      if (config.services.persistence.mongodbEnabled) {
        logger.info(`🗄️ MongoDB: ${databaseConnected ? 'connected' : 'unavailable, continuing in degraded mode'}`);
      } else {
        logger.info('🗄️ MongoDB: disabled');
      }

      // Create HTTP server
      this.server = createServer(this.app);

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${config.server.nodeEnv}`);
        logger.info(`🔗 CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
        logger.info(`⚡ Rate limit: ${config.rateLimit.windowMs}ms window, ${config.rateLimit.max} requests`);
        logger.info(`🛡️ Security: Helmet enabled`);
        logger.info(`📝 Logging: Winston configured`);
        logger.info(`✅ Health check: /health`);
        logger.info(`📚 API docs: /docs`);
      });

      // Setup graceful shutdown
      gracefulShutdown(this.server);

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Get the Express application instance
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Get the HTTP server instance
   */
  public getServer(): any {
    return this.server;
  }
}

// Create and start server
const server = new Server();

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;
