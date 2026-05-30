import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createValidator } from '@/middleware/requestValidator.js';
import { optionalAuth } from '@/middleware/auth.js';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { logger } from '@/utils/logger.js';

const router = Router();

/**
 * Gas calculation request schema
 */
const gasCalculationRequestSchema = z.object({
  distance: z.number().min(0.1).max(100), // miles
  gasPrice: z.number().min(0.5).max(10.0), // per gallon
  mpg: z.number().min(10).max(50), // miles per gallon
  foodCost: z.number().min(0), // pickup food cost
  deliveryCost: z.number().min(0), // delivery cost for comparison
  timeToPickup: z.number().min(1).max(120).optional(), // minutes
  timeToReturn: z.number().min(1).max(120).optional(), // minutes
  userPreferences: z.object({
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
    showDetailedBreakdown: z.boolean().default(true),
    includeTimeValue: z.boolean().default(false),
    hourlyRate: z.number().min(0).max(1000).optional(), // for time value calculation
  }).optional(),
});

/**
 * Gas calculation response schema
 */
const gasCalculationResponseSchema = z.object({
  calculationId: z.string().uuid(),
  timestamp: z.string().datetime(),
  input: z.object({
    distance: z.number(),
    gasPrice: z.number(),
    mpg: z.number(),
    foodCost: z.number(),
    deliveryCost: z.number(),
    timeToPickup: z.number().optional(),
    timeToReturn: z.number().optional(),
  }),
  calculation: z.object({
    gasCost: z.number(),
    totalPickupCost: z.number(),
    savings: z.number(),
    savingsPercentage: z.number(),
    isWorthIt: z.boolean(),
    costPerMile: z.number(),
  }),
  timeAnalysis: z.object({
    timeToPickup: z.number(),
    timeToReturn: z.number(),
    totalTime: z.number(),
    timeValue: z.number().optional(),
    timeCost: z.number().optional(),
  }).optional(),
  breakdown: z.object({
    distance: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    gasPrice: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    mpg: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    gasCost: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    foodCost: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    totalPickupCost: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    deliveryCost: z.object({
      value: z.number(),
      unit: z.string(),
    }),
    savings: z.object({
      value: z.number(),
      unit: z.string(),
    }),
  }),
  recommendations: z.array(z.object({
    type: z.enum(['pickup', 'delivery']),
    reason: z.string(),
    savings: z.number().optional(),
    timeSavings: z.number().optional(),
    confidence: z.number().min(0).max(1),
  })),
  metadata: z.object({
    calculationTime: z.number(),
    requestId: z.string(),
    currency: z.string(),
  }),
});

/**
 * @swagger
 * /api/v1/gas/calculate:
 *   post:
 *     summary: Calculate gas cost for pickup
 *     description: Calculate gas cost for pickup delivery including savings comparison and time analysis
 *     tags: [Gas Calculation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distance
 *               - gasPrice
 *               - mpg
 *               - foodCost
 *               - deliveryCost
 *             properties:
 *               distance:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 100
 *                 description: Round trip distance in miles
 *                 example: 5.0
 *               gasPrice:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 10.0
 *                 description: Gas price per gallon
 *                 example: 3.50
 *               mpg:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 50
 *                 description: Vehicle miles per gallon
 *                 example: 25
 *               foodCost:
 *                 type: number
 *                 minimum: 0
 *                 description: Pickup food cost
 *                 example: 15.50
 *               deliveryCost:
 *                 type: number
 *                 minimum: 0
 *                 description: Delivery cost for comparison
 *                 example: 19.66
 *               timeToPickup:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 120
 *                 description: Time to pickup in minutes
 *                 example: 15
 *               timeToReturn:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 120
 *                 description: Time to return in minutes
 *                 example: 15
 *               userPreferences:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     enum: [USD, EUR, GBP, CAD, AUD]
 *                     default: USD
 *                   showDetailedBreakdown:
 *                     type: boolean
 *                     default: true
 *                   includeTimeValue:
 *                     type: boolean
 *                     default: false
 *                   hourlyRate:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1000
 *                     description: Hourly rate for time value calculation
 *                     example: 25.00
 *     responses:
 *       200:
 *         description: Gas calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calculationId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 input:
 *                   type: object
 *                   properties:
 *                     distance:
 *                       type: number
 *                       example: 5.0
 *                     gasPrice:
 *                       type: number
 *                       example: 3.50
 *                     mpg:
 *                       type: number
 *                       example: 25
 *                     foodCost:
 *                       type: number
 *                       example: 15.50
 *                     deliveryCost:
 *                       type: number
 *                       example: 19.66
 *                     timeToPickup:
 *                       type: number
 *                       example: 15
 *                     timeToReturn:
 *                       type: number
 *                       example: 15
 *                 calculation:
 *                   type: object
 *                   properties:
 *                     gasCost:
 *                       type: number
 *                       example: 0.70
 *                     totalPickupCost:
 *                       type: number
 *                       example: 16.20
 *                     savings:
 *                       type: number
 *                       example: 3.46
 *                     savingsPercentage:
 *                       type: number
 *                       example: 17.6
 *                     isWorthIt:
 *                       type: boolean
 *                       example: true
 *                     costPerMile:
 *                       type: number
 *                       example: 0.14
 *                 timeAnalysis:
 *                   type: object
 *                   properties:
 *                     timeToPickup:
 *                       type: number
 *                       example: 15
 *                     timeToReturn:
 *                       type: number
 *                       example: 15
 *                     totalTime:
 *                       type: number
 *                       example: 30
 *                     timeValue:
 *                       type: number
 *                       example: 12.50
 *                     timeCost:
 *                       type: number
 *                       example: 12.50
 *                 breakdown:
 *                   type: object
 *                   properties:
 *                     distance:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 5.0
 *                         unit:
 *                           type: string
 *                           example: "miles"
 *                     gasPrice:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 3.50
 *                         unit:
 *                           type: string
 *                           example: "per gallon"
 *                     mpg:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 25
 *                         unit:
 *                           type: string
 *                           example: "mpg"
 *                     gasCost:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 0.70
 *                         unit:
 *                           type: string
 *                           example: "USD"
 *                     foodCost:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 15.50
 *                         unit:
 *                           type: string
 *                           example: "USD"
 *                     totalPickupCost:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 16.20
 *                         unit:
 *                           type: string
 *                           example: "USD"
 *                     deliveryCost:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 19.66
 *                         unit:
 *                           type: string
 *                           example: "USD"
 *                     savings:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 3.46
 *                         unit:
 *                           type: string
 *                           example: "USD"
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [pickup, delivery]
 *                       reason:
 *                         type: string
 *                       savings:
 *                         type: number
 *                       timeSavings:
 *                         type: number
 *                       confidence:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 1
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     calculationTime:
 *                       type: number
 *                       example: 45
 *                     requestId:
 *                       type: string
 *                     currency:
 *                       type: string
 *                       example: "USD"
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
router.post('/calculate',
  optionalAuth,
  createValidator({ body: gasCalculationRequestSchema }),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.id;
    
    try {
      const { 
        distance, 
        gasPrice, 
        mpg, 
        foodCost, 
        deliveryCost, 
        timeToPickup = 15, 
        timeToReturn = 15,
        userPreferences = {}
      } = req.body;
      
      // Log gas calculation request
      logger.info('Gas calculation request', {
        requestId,
        userId: req.user?.id,
        distance,
        gasPrice,
        mpg,
        foodCost,
        deliveryCost,
        timeToPickup,
        timeToReturn,
      });

      // Calculate gas cost
      const gasCost = (distance * gasPrice) / mpg;
      const totalPickupCost = foodCost + gasCost;
      const savings = deliveryCost - totalPickupCost;
      const savingsPercentage = deliveryCost > 0 ? (savings / deliveryCost) * 100 : 0;
      const isWorthIt = savings > 0;
      const costPerMile = gasCost / distance;

      // Calculate total time
      const totalTime = timeToPickup + timeToReturn;

      // Calculate time value if requested
      let timeValue: number | undefined;
      let timeCost: number | undefined;
      if (userPreferences.includeTimeValue && userPreferences.hourlyRate) {
        timeValue = (totalTime / 60) * userPreferences.hourlyRate;
        timeCost = timeValue;
      }

      // Generate recommendations
      const recommendations = [];
      
      if (isWorthIt) {
        recommendations.push({
          type: 'pickup',
          reason: `Pickup saves $${savings.toFixed(2)} compared to delivery`,
          savings: savings,
          timeSavings: 0, // Delivery time vs pickup time
          confidence: 0.9,
        });
      } else {
        recommendations.push({
          type: 'delivery',
          reason: `Delivery is more cost-effective by $${Math.abs(savings).toFixed(2)}`,
          savings: Math.abs(savings),
          timeSavings: 0,
          confidence: 0.8,
        });
      }

      // Add time-based recommendation if time value is significant
      if (timeValue && timeValue > savings) {
        recommendations.push({
          type: 'delivery',
          reason: `Your time is worth $${timeValue.toFixed(2)}/hour, making delivery more cost-effective`,
          savings: timeValue - savings,
          timeSavings: totalTime,
          confidence: 0.7,
        });
      }

      const response = {
        calculationId: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        input: {
          distance,
          gasPrice,
          mpg,
          foodCost,
          deliveryCost,
          timeToPickup,
          timeToReturn,
        },
        calculation: {
          gasCost: Math.round(gasCost * 100) / 100,
          totalPickupCost: Math.round(totalPickupCost * 100) / 100,
          savings: Math.round(savings * 100) / 100,
          savingsPercentage: Math.round(savingsPercentage * 10) / 10,
          isWorthIt,
          costPerMile: Math.round(costPerMile * 1000) / 1000,
        },
        timeAnalysis: {
          timeToPickup,
          timeToReturn,
          totalTime,
          timeValue,
          timeCost,
        },
        breakdown: {
          distance: { value: distance, unit: 'miles' },
          gasPrice: { value: gasPrice, unit: 'per gallon' },
          mpg: { value: mpg, unit: 'mpg' },
          gasCost: { value: Math.round(gasCost * 100) / 100, unit: userPreferences.currency || 'USD' },
          foodCost: { value: foodCost, unit: userPreferences.currency || 'USD' },
          totalPickupCost: { value: Math.round(totalPickupCost * 100) / 100, unit: userPreferences.currency || 'USD' },
          deliveryCost: { value: deliveryCost, unit: userPreferences.currency || 'USD' },
          savings: { value: Math.round(savings * 100) / 100, unit: userPreferences.currency || 'USD' },
        },
        recommendations,
        metadata: {
          calculationTime: Date.now() - startTime,
          requestId,
          currency: userPreferences.currency || 'USD',
        },
      };

      // Log successful gas calculation
      logger.info('Gas calculation completed', {
        requestId,
        userId: req.user?.id,
        calculationId: response.calculationId,
        gasCost: response.calculation.gasCost,
        totalPickupCost: response.calculation.totalPickupCost,
        savings: response.calculation.savings,
        isWorthIt: response.calculation.isWorthIt,
        calculationTime: response.metadata.calculationTime,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('Gas calculation failed', {
        requestId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        calculationTime: Date.now() - startTime,
      });
      next(error);
    }
  })
);

export { router as gasRouter };
