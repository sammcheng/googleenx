import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config.js';
import { logger } from '@/utils/logger.js';
import { AppError, createError } from './errorHandler.js';

/**
 * JWT payload interface
 */
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Extended Request interface with user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tier: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT tokens and sets user context
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.authentication('Authorization header missing or invalid');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw createError.authentication('Token not provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.security.jwt.secret, {
      issuer: config.security.jwt.issuer,
      audience: config.security.jwt.audience,
    }) as JWTPayload;

    // Set user context
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: 'user', // TODO: Get from database
      tier: 'free', // TODO: Get from database
    };

    // Log authentication
    logger.info('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
      requestId: req.id,
      ip: req.ip,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', {
        error: error.message,
        requestId: req.id,
        ip: req.ip,
      });
      next(createError.authentication('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', {
        error: error.message,
        requestId: req.id,
        ip: req.ip,
      });
      next(createError.authentication('Token expired'));
    } else {
      logger.error('Authentication error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.id,
        ip: req.ip,
      });
      next(createError.authentication('Authentication failed'));
    }
  }
};

/**
 * Optional authentication middleware
 * Sets user context if token is provided, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.security.jwt.secret, {
      issuer: config.security.jwt.issuer,
      audience: config.security.jwt.audience,
    }) as JWTPayload;

    // Set user context
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: 'user',
      tier: 'free',
    };

    logger.info('Optional authentication successful', {
      userId: req.user.id,
      email: req.user.email,
      requestId: req.id,
    });

    next();
  } catch (error) {
    // Log but don't fail for optional auth
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.id,
    });
    next(); // Continue without authentication
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.authentication('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        requestId: req.id,
      });
      return next(createError.authorization('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Tier-based authorization middleware
 */
export const authorizeTier = (tiers: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.authentication('Authentication required'));
    }

    if (!tiers.includes(req.user.tier)) {
      logger.warn('Tier authorization failed', {
        userId: req.user.id,
        userTier: req.user.tier,
        requiredTiers: tiers,
        requestId: req.id,
      });
      return next(createError.authorization('Insufficient tier access'));
    }

    next();
  };
};

/**
 * API key authentication middleware
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next(createError.authentication('API key required'));
  }

  if (apiKey !== config.security.apiKey.value) {
    logger.warn('Invalid API key', {
      apiKey: apiKey.substring(0, 8) + '...', // Log partial key for security
      requestId: req.id,
      ip: req.ip,
    });
    return next(createError.authentication('Invalid API key'));
  }

  // Set API key context
  req.user = {
    id: 'api-key',
    email: 'api@food-price-comparison.com',
    role: 'api',
    tier: 'enterprise',
  };

  logger.info('API key authentication successful', {
    requestId: req.id,
    ip: req.ip,
  });

  next();
};

/**
 * Rate limiting based on user tier
 */
export const tierBasedRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(); // Use default rate limiting
  }

  const tierLimits = {
    free: { windowMs: 15 * 60 * 1000, max: 100 },
    premium: { windowMs: 15 * 60 * 1000, max: 1000 },
    enterprise: { windowMs: 15 * 60 * 1000, max: 10000 },
  };

  const limit = tierLimits[req.user.tier as keyof typeof tierLimits] || tierLimits.free;
  
  // TODO: Implement tier-based rate limiting
  // This would typically use a rate limiter with the user's tier limits
  
  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: config.security.jwt.issuer,
    aud: config.security.jwt.audience,
  };

  return jwt.sign(payload, config.security.jwt.secret);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.security.jwt.secret, {
    issuer: config.security.jwt.issuer,
    audience: config.security.jwt.audience,
  }) as JWTPayload;
};

export default authenticate;
