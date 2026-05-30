import rateLimit from 'express-rate-limit';
import { config } from '@/config/config.js';
import { logger } from '@/utils/logger.js';

/**
 * Rate limiting middleware with Redis store support
 * Prevents abuse and ensures fair usage
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: config.rateLimit.message.error,
    retryAfter: config.rateLimit.message.retryAfter,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  skip: config.rateLimit.skip,
  
  // Custom key generator for more granular control
  keyGenerator: (req) => {
    // Use IP address as primary key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Add user ID if authenticated
    const userId = req.user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    
    // Add API key if present
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return `api:${apiKey}`;
    }
    
    return `ip:${ip}`;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log rate limit exceeded
    logger.warn('Rate limit exceeded', {
      ip,
      userAgent,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    
    res.status(429).json({
      error: config.rateLimit.message.error,
      retryAfter: config.rateLimit.message.retryAfter,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  },
  
  // Skip successful requests from rate limit count
  skipSuccessfulRequests: false,
  
  // Skip failed requests from rate limit count
  skipFailedRequests: false,
});

/**
 * Strict rate limiter for sensitive endpoints
 * More restrictive limits for authentication and payment endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `strict:${ip}`;
  },
  
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    logger.warn('Strict rate limit exceeded', {
      ip,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  },
});

/**
 * API key rate limiter
 * Different limits for API key authenticated requests
 */
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: {
    error: 'API rate limit exceeded',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] as string;
    return `apikey:${apiKey}`;
  },
  
  skip: (req) => {
    // Only apply to requests with API key
    return !req.headers['x-api-key'];
  },
  
  handler: (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    logger.warn('API key rate limit exceeded', {
      apiKey: apiKey?.substring(0, 8) + '...', // Log partial key for security
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    
    res.status(429).json({
      error: 'API rate limit exceeded',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  },
});

/**
 * Dynamic rate limiter based on user tier
 */
export const dynamicRateLimiter = (req: any, res: any, next: any) => {
  // Get user tier from request (set by auth middleware)
  const userTier = req.user?.tier || 'free';
  
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 100 }, // 15 minutes, 100 requests
    premium: { windowMs: 15 * 60 * 1000, max: 1000 }, // 15 minutes, 1000 requests
    enterprise: { windowMs: 15 * 60 * 1000, max: 10000 }, // 15 minutes, 10000 requests
  };
  
  const limit = limits[userTier as keyof typeof limits] || limits.free;
  
  const limiter = rateLimit({
    ...limit,
    keyGenerator: (req) => {
      const userId = req.user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    },
    message: {
      error: `Rate limit exceeded for ${userTier} tier`,
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  limiter(req, res, next);
};

/**
 * Rate limiter for specific endpoints
 */
export const endpointRateLimiters = {
  // Authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many authentication attempts',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Password reset endpoints
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
      error: 'Too many password reset attempts',
      retryAfter: '1 hour',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Search endpoints
  search: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
      error: 'Too many search requests',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Data scraping endpoints
  scraping: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 scraping requests per minute
    message: {
      error: 'Too many scraping requests',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

export default rateLimiter;