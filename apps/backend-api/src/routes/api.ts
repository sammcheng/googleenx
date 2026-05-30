import { Router } from 'express';
import { logger } from '@/utils/logger.js';

const router = Router();

/**
 * API v1 routes
 * Main API endpoint router
 */

// Import route modules
import { compareRouter } from './compare.js';
import { restaurantsRouter } from './restaurants.js';
import { gasRouter } from './gas.js';
import { userRouter } from './user.js';

/**
 * API information endpoint
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Food Price Comparison API v1',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      compare: '/api/v1/compare',
      restaurants: '/api/v1/restaurants',
      gas: '/api/v1/gas',
      user: '/api/v1/user',
    },
    features: [
      'CORS for Chrome extension origins',
      'Helmet security middleware',
      'Rate limiting',
      'Request validation with Zod',
      'Structured logging with Winston',
      'Health check endpoint',
      'Error handling middleware',
      'Graceful shutdown',
    ],
  });
});

/**
 * API status endpoint
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * API metrics endpoint (if monitoring is enabled)
 */
router.get('/metrics', (req, res) => {
  // TODO: Implement metrics collection
  res.json({
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
    },
    responseTime: {
      average: 0,
      p95: 0,
      p99: 0,
    },
    errors: {
      total: 0,
      byType: {},
    },
  });
});

// Mount route modules
router.use('/compare', compareRouter);
router.use('/restaurants', restaurantsRouter);
router.use('/gas', gasRouter);
router.use('/user', userRouter);

/**
 * API documentation endpoint
 */
router.get('/docs', (req, res) => {
  res.json({
    title: 'Food Price Comparison API',
    version: '1.0.0',
    description: 'Production-ready API for food price comparison Chrome extension',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
        responses: {
          200: 'Server is healthy',
          503: 'Server is unhealthy',
        },
      },
      auth: {
        method: 'POST',
        path: '/auth/login',
        description: 'User authentication',
        requestBody: {
          email: 'string (required)',
          password: 'string (required)',
        },
        responses: {
          200: 'Authentication successful',
          401: 'Invalid credentials',
          429: 'Too many attempts',
        },
      },
      search: {
        method: 'GET',
        path: '/search/restaurants',
        description: 'Search for restaurants',
        queryParameters: {
          q: 'string (required) - search query',
          location: 'string (required) - location coordinates',
          radius: 'number (optional) - search radius in miles',
        },
        responses: {
          200: 'Search results',
          400: 'Invalid parameters',
          429: 'Rate limit exceeded',
        },
      },
      priceComparison: {
        method: 'POST',
        path: '/price-comparison',
        description: 'Compare prices across platforms',
        requestBody: {
          items: 'array (required) - list of food items',
          location: 'object (required) - delivery location',
          platforms: 'array (optional) - preferred platforms',
        },
        responses: {
          200: 'Price comparison results',
          400: 'Invalid request',
          429: 'Rate limit exceeded',
        },
      },
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      description: 'JWT token required for protected endpoints',
    },
    rateLimiting: {
      window: '15 minutes',
      limit: '100 requests per window',
      headers: {
        'X-RateLimit-Limit': 'Request limit per window',
        'X-RateLimit-Remaining': 'Remaining requests in current window',
        'X-RateLimit-Reset': 'Time when the rate limit resets',
      },
    },
    cors: {
      allowedOrigins: [
        'chrome-extension://*',
        'moz-extension://*',
        'safari-extension://*',
        'ms-browser-extension://*',
      ],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  });
});

export { router as apiRouter };
