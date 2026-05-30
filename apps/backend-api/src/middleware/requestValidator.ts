import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema, ZodError } from 'zod';
import { logger } from '@/utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Request validation middleware using Zod
 * Validates request body, query parameters, and route parameters
 */
export const requestValidator = (req: Request, res: Response, next: NextFunction) => {
  // Add request ID for tracking
  req.id = generateRequestId();
  
  // Basic request validation
  const basicValidation = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    url: z.string().min(1),
    headers: z.record(z.string()),
  });
  
  try {
    basicValidation.parse({
      method: req.method,
      url: req.url,
      headers: req.headers,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Basic request validation failed', {
        requestId: req.id,
        errors: error.errors,
        method: req.method,
        url: req.url,
      });
      
      res.status(400).json({
        error: 'Invalid request format',
        details: error.errors,
        requestId: req.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      next(error);
    }
  }
};

/**
 * Create a validation middleware for specific schemas
 */
export const createValidator = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any[] = [];
    
    try {
      // Validate request body
      if (schemas.body && req.body) {
        req.body = schemas.body.parse(req.body);
      }
      
      // Validate query parameters
      if (schemas.query && req.query) {
        req.query = schemas.query.parse(req.query);
      }
      
      // Validate route parameters
      if (schemas.params && req.params) {
        req.params = schemas.params.parse(req.params);
      }
      
      // Validate headers
      if (schemas.headers && req.headers) {
        req.headers = schemas.headers.parse(req.headers);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Request validation failed', {
          requestId: req.id,
          errors: error.errors,
          method: req.method,
          url: req.url,
          body: req.body,
          query: req.query,
          params: req.params,
        });
        
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
          requestId: req.id,
          timestamp: new Date().toISOString(),
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination schema
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
  
  // ID parameter schema
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  
  // Search query schema
  search: z.object({
    q: z.string().min(1).max(100),
    category: z.string().optional(),
    location: z.string().optional(),
    radius: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
  
  // Date range schema
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  
  // Coordinates schema
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  
  // Address schema
  address: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().min(2).max(2).default('US'),
  }),
};

/**
 * Food delivery specific schemas
 */
export const foodDeliverySchemas = {
  // Restaurant search schema
  restaurantSearch: z.object({
    query: z.string().min(1).max(100),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    radius: z.number().min(0.1).max(50).default(5),
    cuisine: z.string().optional(),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
    rating: z.number().min(0).max(5).optional(),
  }),
  
  // Menu item schema
  menuItem: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    price: z.number().min(0),
    category: z.string().min(1).max(100),
    allergens: z.array(z.string()).optional(),
    dietary: z.array(z.enum(['vegetarian', 'vegan', 'gluten-free', 'dairy-free'])).optional(),
  }),
  
  // Order schema
  order: z.object({
    restaurantId: z.string().uuid(),
    items: z.array(z.object({
      menuItemId: z.string().uuid(),
      quantity: z.number().min(1).max(10),
      specialInstructions: z.string().max(200).optional(),
    })).min(1),
    deliveryAddress: commonSchemas.address,
    paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay']),
    tip: z.number().min(0).max(100).optional(),
  }),
  
  // Price comparison schema
  priceComparison: z.object({
    items: z.array(z.object({
      name: z.string().min(1),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })).min(1),
    location: commonSchemas.coordinates,
    deliveryAddress: commonSchemas.address,
    preferredPlatforms: z.array(z.enum(['doordash', 'ubereats', 'grubhub'])).optional(),
  }),
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  // Login schema
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8).max(128),
    rememberMe: z.boolean().optional(),
  }),
  
  // Registration schema
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8).max(128).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
    confirmPassword: z.string(),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted'),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
  
  // Password reset schema
  passwordReset: z.object({
    email: z.string().email('Invalid email format'),
  }),
  
  // Password reset confirm schema
  passwordResetConfirm: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
};

/**
 * User profile schemas
 */
export const userSchemas = {
  // Profile update schema
  profileUpdate: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
    address: commonSchemas.address.optional(),
    preferences: z.object({
      dietaryRestrictions: z.array(z.string()).optional(),
      favoriteCuisines: z.array(z.string()).optional(),
      maxDeliveryDistance: z.number().min(0.1).max(50).optional(),
      notificationSettings: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        sms: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }),
  
  // Settings update schema
  settingsUpdate: z.object({
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).optional(),
    language: z.string().min(2).max(5).optional(),
    timezone: z.string().optional(),
    units: z.enum(['metric', 'imperial']).optional(),
  }),
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize input data
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Validation error formatter
 */
export const formatValidationError = (error: ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

export default requestValidator;
