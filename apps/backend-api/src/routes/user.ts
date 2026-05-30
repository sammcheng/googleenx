import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createValidator } from '@/middleware/requestValidator.js';
import { authenticate } from '@/middleware/auth.js';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { logger } from '@/utils/logger.js';

const router = Router();

/**
 * User preferences schema
 */
const userPreferencesSchema = z.object({
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  language: z.string().min(2).max(5).default('en'),
  timezone: z.string().default('America/New_York'),
  units: z.enum(['metric', 'imperial']).default('imperial'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    priceAlerts: z.boolean().default(true),
    comparisonResults: z.boolean().default(true),
    newFeatures: z.boolean().default(false),
  }).default({}),
  delivery: z.object({
    maxDistance: z.number().min(0.1).max(50).default(10),
    maxDeliveryTime: z.number().min(5).max(120).default(60),
    preferredPlatforms: z.array(z.enum(['doordash', 'ubereats', 'grubhub'])).default([]),
    dietaryRestrictions: z.array(z.string()).default([]),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
    autoCompare: z.boolean().default(true),
  }).default({}),
  gas: z.object({
    mpg: z.number().min(10).max(50).default(25),
    gasPrice: z.number().min(0.5).max(10.0).default(3.50),
    includeTimeValue: z.boolean().default(false),
    hourlyRate: z.number().min(0).max(1000).optional(),
    autoCalculate: z.boolean().default(true),
  }).default({}),
  privacy: z.object({
    shareData: z.boolean().default(false),
    analytics: z.boolean().default(true),
    personalizedAds: z.boolean().default(false),
    dataRetention: z.enum(['30', '90', '365', 'forever']).default('90'),
  }).default({}),
  accessibility: z.object({
    highContrast: z.boolean().default(false),
    largeText: z.boolean().default(false),
    screenReader: z.boolean().default(false),
    keyboardNavigation: z.boolean().default(false),
  }).default({}),
});

/**
 * User preferences response schema
 */
const userPreferencesResponseSchema = z.object({
  userId: z.string().uuid(),
  preferences: userPreferencesSchema,
  lastUpdated: z.string().datetime(),
  version: z.string(),
  metadata: z.object({
    requestId: z.string(),
    source: z.string(),
  }),
});

/**
 * @swagger
 * /api/v1/user/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Retrieve user preferences and settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     currency:
 *                       type: string
 *                       enum: [USD, EUR, GBP, CAD, AUD]
 *                       example: "USD"
 *                     language:
 *                       type: string
 *                       example: "en"
 *                     timezone:
 *                       type: string
 *                       example: "America/New_York"
 *                     units:
 *                       type: string
 *                       enum: [metric, imperial]
 *                       example: "imperial"
 *                     notifications:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: boolean
 *                           example: true
 *                         push:
 *                           type: boolean
 *                           example: true
 *                         sms:
 *                           type: boolean
 *                           example: false
 *                         priceAlerts:
 *                           type: boolean
 *                           example: true
 *                         comparisonResults:
 *                           type: boolean
 *                           example: true
 *                         newFeatures:
 *                           type: boolean
 *                           example: false
 *                     delivery:
 *                       type: object
 *                       properties:
 *                         maxDistance:
 *                           type: number
 *                           minimum: 0.1
 *                           maximum: 50
 *                           example: 10
 *                         maxDeliveryTime:
 *                           type: number
 *                           minimum: 5
 *                           maximum: 120
 *                           example: 60
 *                         preferredPlatforms:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: [doordash, ubereats, grubhub]
 *                           example: ["doordash", "ubereats"]
 *                         dietaryRestrictions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["vegetarian", "gluten-free"]
 *                         priceRange:
 *                           type: string
 *                           enum: [$, $$, $$$, $$$$]
 *                           example: "$$"
 *                         autoCompare:
 *                           type: boolean
 *                           example: true
 *                     gas:
 *                       type: object
 *                       properties:
 *                         mpg:
 *                           type: number
 *                           minimum: 10
 *                           maximum: 50
 *                           example: 25
 *                         gasPrice:
 *                           type: number
 *                           minimum: 0.5
 *                           maximum: 10.0
 *                           example: 3.50
 *                         includeTimeValue:
 *                           type: boolean
 *                           example: false
 *                         hourlyRate:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 1000
 *                           example: 25.00
 *                         autoCalculate:
 *                           type: boolean
 *                           example: true
 *                     privacy:
 *                       type: object
 *                       properties:
 *                         shareData:
 *                           type: boolean
 *                           example: false
 *                         analytics:
 *                           type: boolean
 *                           example: true
 *                         personalizedAds:
 *                           type: boolean
 *                           example: false
 *                         dataRetention:
 *                           type: string
 *                           enum: [30, 90, 365, forever]
 *                           example: "90"
 *                     accessibility:
 *                       type: object
 *                       properties:
 *                         highContrast:
 *                           type: boolean
 *                           example: false
 *                         largeText:
 *                           type: boolean
 *                           example: false
 *                         screenReader:
 *                           type: boolean
 *                           example: false
 *                         keyboardNavigation:
 *                           type: boolean
 *                           example: false
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                     source:
 *                       type: string
 *                       example: "user_preferences_api"
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
 *       404:
 *         description: User preferences not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User preferences not found"
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
router.get('/preferences',
  authenticate,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.id;
    const userId = req.user!.id;
    
    try {
      // Log user preferences request
      logger.info('User preferences request', {
        requestId,
        userId,
      });

      // TODO: Implement actual user preferences retrieval
      // This would typically:
      // 1. Query database for user preferences
      // 2. Return default preferences if none exist
      // 3. Merge with system defaults

      // Mock response for now
      const preferences = {
        currency: 'USD',
        language: 'en',
        timezone: 'America/New_York',
        units: 'imperial',
        notifications: {
          email: true,
          push: true,
          sms: false,
          priceAlerts: true,
          comparisonResults: true,
          newFeatures: false,
        },
        delivery: {
          maxDistance: 10,
          maxDeliveryTime: 60,
          preferredPlatforms: ['doordash', 'ubereats'],
          dietaryRestrictions: ['vegetarian', 'gluten-free'],
          priceRange: '$$',
          autoCompare: true,
        },
        gas: {
          mpg: 25,
          gasPrice: 3.50,
          includeTimeValue: false,
          hourlyRate: 25.00,
          autoCalculate: true,
        },
        privacy: {
          shareData: false,
          analytics: true,
          personalizedAds: false,
          dataRetention: '90',
        },
        accessibility: {
          highContrast: false,
          largeText: false,
          screenReader: false,
          keyboardNavigation: false,
        },
      };

      const response = {
        userId,
        preferences,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        metadata: {
          requestId,
          source: 'user_preferences_api',
        },
      };

      // Log successful preferences retrieval
      logger.info('User preferences retrieved', {
        requestId,
        userId,
        searchTime: Date.now() - startTime,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('User preferences retrieval failed', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        searchTime: Date.now() - startTime,
      });
      next(error);
    }
  })
);

/**
 * @swagger
 * /api/v1/user/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences and settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, CAD, AUD]
 *                 example: "USD"
 *               language:
 *                 type: string
 *                 example: "en"
 *               timezone:
 *                 type: string
 *                 example: "America/New_York"
 *               units:
 *                 type: string
 *                 enum: [metric, imperial]
 *                 example: "imperial"
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   push:
 *                     type: boolean
 *                     example: true
 *                   sms:
 *                     type: boolean
 *                     example: false
 *                   priceAlerts:
 *                     type: boolean
 *                     example: true
 *                   comparisonResults:
 *                     type: boolean
 *                     example: true
 *                   newFeatures:
 *                     type: boolean
 *                     example: false
 *               delivery:
 *                 type: object
 *                 properties:
 *                   maxDistance:
 *                     type: number
 *                     minimum: 0.1
 *                     maximum: 50
 *                     example: 10
 *                   maxDeliveryTime:
 *                     type: number
 *                     minimum: 5
 *                     maximum: 120
 *                     example: 60
 *                   preferredPlatforms:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [doordash, ubereats, grubhub]
 *                     example: ["doordash", "ubereats"]
 *                   dietaryRestrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["vegetarian", "gluten-free"]
 *                   priceRange:
 *                     type: string
 *                     enum: [$, $$, $$$, $$$$]
 *                     example: "$$"
 *                   autoCompare:
 *                     type: boolean
 *                     example: true
 *               gas:
 *                 type: object
 *                 properties:
 *                   mpg:
 *                     type: number
 *                     minimum: 10
 *                     maximum: 50
 *                     example: 25
 *                   gasPrice:
 *                     type: number
 *                     minimum: 0.5
 *                     maximum: 10.0
 *                     example: 3.50
 *                   includeTimeValue:
 *                     type: boolean
 *                     example: false
 *                   hourlyRate:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1000
 *                     example: 25.00
 *                   autoCalculate:
 *                     type: boolean
 *                     example: true
 *               privacy:
 *                 type: object
 *                 properties:
 *                   shareData:
 *                     type: boolean
 *                     example: false
 *                   analytics:
 *                     type: boolean
 *                     example: true
 *                   personalizedAds:
 *                     type: boolean
 *                     example: false
 *                   dataRetention:
 *                     type: string
 *                     enum: [30, 90, 365, forever]
 *                     example: "90"
 *               accessibility:
 *                 type: object
 *                 properties:
 *                   highContrast:
 *                     type: boolean
 *                     example: false
 *                   largeText:
 *                     type: boolean
 *                     example: false
 *                   screenReader:
 *                     type: boolean
 *                     example: false
 *                   keyboardNavigation:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     currency:
 *                       type: string
 *                       enum: [USD, EUR, GBP, CAD, AUD]
 *                       example: "USD"
 *                     language:
 *                       type: string
 *                       example: "en"
 *                     timezone:
 *                       type: string
 *                       example: "America/New_York"
 *                     units:
 *                       type: string
 *                       enum: [metric, imperial]
 *                       example: "imperial"
 *                     notifications:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: boolean
 *                           example: true
 *                         push:
 *                           type: boolean
 *                           example: true
 *                         sms:
 *                           type: boolean
 *                           example: false
 *                         priceAlerts:
 *                           type: boolean
 *                           example: true
 *                         comparisonResults:
 *                           type: boolean
 *                           example: true
 *                         newFeatures:
 *                           type: boolean
 *                           example: false
 *                     delivery:
 *                       type: object
 *                       properties:
 *                         maxDistance:
 *                           type: number
 *                           minimum: 0.1
 *                           maximum: 50
 *                           example: 10
 *                         maxDeliveryTime:
 *                           type: number
 *                           minimum: 5
 *                           maximum: 120
 *                           example: 60
 *                         preferredPlatforms:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: [doordash, ubereats, grubhub]
 *                           example: ["doordash", "ubereats"]
 *                         dietaryRestrictions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["vegetarian", "gluten-free"]
 *                         priceRange:
 *                           type: string
 *                           enum: [$, $$, $$$, $$$$]
 *                           example: "$$"
 *                         autoCompare:
 *                           type: boolean
 *                           example: true
 *                     gas:
 *                       type: object
 *                       properties:
 *                         mpg:
 *                           type: number
 *                           minimum: 10
 *                           maximum: 50
 *                           example: 25
 *                         gasPrice:
 *                           type: number
 *                           minimum: 0.5
 *                           maximum: 10.0
 *                           example: 3.50
 *                         includeTimeValue:
 *                           type: boolean
 *                           example: false
 *                         hourlyRate:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 1000
 *                           example: 25.00
 *                         autoCalculate:
 *                           type: boolean
 *                           example: true
 *                     privacy:
 *                       type: object
 *                       properties:
 *                         shareData:
 *                           type: boolean
 *                           example: false
 *                         analytics:
 *                           type: boolean
 *                           example: true
 *                         personalizedAds:
 *                           type: boolean
 *                           example: false
 *                         dataRetention:
 *                           type: string
 *                           enum: [30, 90, 365, forever]
 *                           example: "90"
 *                     accessibility:
 *                       type: object
 *                       properties:
 *                         highContrast:
 *                           type: boolean
 *                           example: false
 *                         largeText:
 *                           type: boolean
 *                           example: false
 *                         screenReader:
 *                           type: boolean
 *                           example: false
 *                         keyboardNavigation:
 *                           type: boolean
 *                           example: false
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                     source:
 *                       type: string
 *                       example: "user_preferences_api"
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
router.put('/preferences',
  authenticate,
  createValidator({ body: userPreferencesSchema }),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.id;
    const userId = req.user!.id;
    
    try {
      const preferences = req.body;
      
      // Log user preferences update
      logger.info('User preferences update request', {
        requestId,
        userId,
        preferences,
      });

      // TODO: Implement actual user preferences update
      // This would typically:
      // 1. Validate preferences against user permissions
      // 2. Update database with new preferences
      // 3. Send confirmation notification
      // 4. Update user session if needed

      const response = {
        userId,
        preferences,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        metadata: {
          requestId,
          source: 'user_preferences_api',
        },
      };

      // Log successful preferences update
      logger.info('User preferences updated', {
        requestId,
        userId,
        updateTime: Date.now() - startTime,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('User preferences update failed', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        updateTime: Date.now() - startTime,
      });
      next(error);
    }
  })
);

export { router as userRouter };
