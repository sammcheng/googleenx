import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createValidator } from '@/middleware/requestValidator.js';
import { authenticate, optionalAuth } from '@/middleware/auth.js';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { logger } from '@/utils/logger.js';
import { ComparisonController, ComparisonControllerContainer } from '@/controllers/ComparisonController.js';
import { ComparisonService } from '@/services/ComparisonService.js';

const router = Router();

// Initialize comparison service and controller
const comparisonService = new ComparisonService();
const container = ComparisonControllerContainer.getInstance();
container.registerComparisonService(comparisonService);
const comparisonController = container.getComparisonController();

/**
 * Price comparison request schema
 */
const compareRequestSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(10),
    price: z.number().min(0),
    category: z.string().optional(),
    modifiers: z.array(z.string()).optional(),
  })).min(1).max(20),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1).max(500).optional(),
  }),
  deliveryAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().min(2).max(2).default('US'),
  }),
  preferredPlatforms: z.array(z.enum(['doordash', 'ubereats', 'grubhub'])).optional(),
  includePickup: z.boolean().default(true),
  includeGasCalculation: z.boolean().default(true),
  userPreferences: z.object({
    maxDeliveryDistance: z.number().min(0.1).max(50).default(10),
    maxDeliveryTime: z.number().min(5).max(120).default(60),
    dietaryRestrictions: z.array(z.string()).optional(),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  }).optional(),
});

/**
 * Price comparison response schema
 */
const compareResponseSchema = z.object({
  comparisonId: z.string().min(1),
  timestamp: z.string().datetime(),
  totalItems: z.number().int(),
  totalValue: z.number(),
  platforms: z.array(z.object({
    platform: z.enum(['doordash', 'ubereats', 'grubhub']),
    available: z.boolean(),
    delivery: z.object({
      available: z.boolean(),
      price: z.number().optional(),
      deliveryFee: z.number().optional(),
      serviceFee: z.number().optional(),
      tax: z.number().optional(),
      total: z.number().optional(),
      estimatedTime: z.number().optional(),
      restaurant: z.object({
        id: z.string(),
        name: z.string(),
        rating: z.number().optional(),
        distance: z.number().optional(),
        cuisine: z.string().optional(),
      }),
    }),
    pickup: z.object({
      available: z.boolean(),
      price: z.number().optional(),
      estimatedTime: z.number().optional(),
      restaurant: z.object({
        id: z.string(),
        name: z.string(),
        rating: z.number().optional(),
        distance: z.number().optional(),
        cuisine: z.string().optional(),
      }),
    }),
    gasCalculation: z.object({
      distance: z.number().optional(),
      gasCost: z.number().optional(),
      totalPickupCost: z.number().optional(),
      savings: z.number().optional(),
      isWorthIt: z.boolean().optional(),
    }).optional(),
  })),
  recommendations: z.array(z.object({
    platform: z.string(),
    reason: z.string(),
    savings: z.number().optional(),
    timeSavings: z.number().optional(),
  })),
  metadata: z.object({
    searchRadius: z.number(),
    searchTime: z.number(),
    cacheHit: z.boolean(),
    requestId: z.string(),
  }),
});

/**
 * @swagger
 * /api/v1/compare:
 *   post:
 *     summary: Compare food prices across platforms
 *     description: Compare food prices across DoorDash, Uber Eats, and Grubhub with gas cost calculations
 *     tags: [Price Comparison]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - location
 *               - deliveryAddress
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Margherita Pizza"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 10
 *                       example: 2
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       example: 15.99
 *                     category:
 *                       type: string
 *                       example: "Pizza"
 *                     modifiers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Extra Cheese", "Gluten-Free Crust"]
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 40.7128
 *                   lng:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: -74.0060
 *                   address:
 *                     type: string
 *                     example: "123 Main St, New York, NY 10001"
 *               deliveryAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "456 Oak Ave"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   zipCode:
 *                     type: string
 *                     pattern: '^\d{5}(-\d{4})?$'
 *                     example: "10001"
 *                   country:
 *                     type: string
 *                     default: "US"
 *                     example: "US"
 *               preferredPlatforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [doordash, ubereats, grubhub]
 *                 example: ["doordash", "ubereats"]
 *               includePickup:
 *                 type: boolean
 *                 default: true
 *               includeGasCalculation:
 *                 type: boolean
 *                 default: true
 *               userPreferences:
 *                 type: object
 *                 properties:
 *                   maxDeliveryDistance:
 *                     type: number
 *                     minimum: 0.1
 *                     maximum: 50
 *                     default: 10
 *                   maxDeliveryTime:
 *                     type: number
 *                     minimum: 5
 *                     maximum: 120
 *                     default: 60
 *                   dietaryRestrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["vegetarian", "gluten-free"]
 *                   priceRange:
 *                     type: string
 *                     enum: [$, $$, $$$, $$$$]
 *     responses:
 *       200:
 *         description: Price comparison successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comparisonId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 totalItems:
 *                   type: integer
 *                   example: 3
 *                 totalValue:
 *                   type: number
 *                   example: 45.97
 *                 platforms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       platform:
 *                         type: string
 *                         enum: [doordash, ubereats, grubhub]
 *                       available:
 *                         type: boolean
 *                       delivery:
 *                         type: object
 *                         properties:
 *                           available:
 *                             type: boolean
 *                           price:
 *                             type: number
 *                           deliveryFee:
 *                             type: number
 *                           serviceFee:
 *                             type: number
 *                           tax:
 *                             type: number
 *                           total:
 *                             type: number
 *                           estimatedTime:
 *                             type: number
 *                           restaurant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               rating:
 *                                 type: number
 *                               distance:
 *                                 type: number
 *                               cuisine:
 *                                 type: string
 *                       pickup:
 *                         type: object
 *                         properties:
 *                           available:
 *                             type: boolean
 *                           price:
 *                             type: number
 *                           estimatedTime:
 *                             type: number
 *                           restaurant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               rating:
 *                                 type: number
 *                               distance:
 *                                 type: number
 *                               cuisine:
 *                                 type: string
 *                       gasCalculation:
 *                         type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                           gasCost:
 *                             type: number
 *                           totalPickupCost:
 *                             type: number
 *                           savings:
 *                             type: number
 *                           isWorthIt:
 *                             type: boolean
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       platform:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       savings:
 *                         type: number
 *                       timeSavings:
 *                         type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     searchRadius:
 *                       type: number
 *                     searchTime:
 *                       type: number
 *                     cacheHit:
 *                       type: boolean
 *                     requestId:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *                       code:
 *                         type: string
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Authentication required"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Too many requests"
 *                 retryAfter:
 *                   type: string
 *                   example: "15 minutes"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/', 
  optionalAuth,
  createValidator({ body: compareRequestSchema }),
  asyncHandler(comparisonController.comparePrices.bind(comparisonController))
);

/**
 * Clear cache
 */
router.delete('/cache',
  authenticate,
  asyncHandler(comparisonController.clearCache.bind(comparisonController))
);

/**
 * Get performance metrics
 */
router.get('/metrics',
  authenticate,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = comparisonController.getPerformanceMetrics();
      res.status(200).json({
        metrics,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      });
    } catch (error) {
      next(error);
    }
  })
);

/**
 * Health check for comparison service
 */
router.get('/health',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await comparisonController.healthCheck();
      res.status(200).json({
        ...health,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      });
    } catch (error) {
      next(error);
    }
  })
);

/**
 * Get comparison by ID
 */
router.get('/:id',
  optionalAuth,
  asyncHandler(comparisonController.getComparisonById.bind(comparisonController))
);

export { router as compareRouter };
