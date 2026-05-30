import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '@/utils/logger.js';
import type { IComparisonService, ComparisonRequest, ComparisonResult } from '@/services/ComparisonService.js';
import { AppError, createError } from '@/middleware/errorHandler.js';

/**
 * Comparison request validation schema
 */
const comparisonRequestSchema = z.object({
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
    address: z.string().optional(),
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
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
    mpg: z.number().min(10).max(50).optional(),
    gasPrice: z.number().min(0.5).max(10.0).optional(),
    includeTimeValue: z.boolean().default(false),
    hourlyRate: z.number().min(0).max(1000).optional(),
  }).optional(),
});

/**
 * Comparison controller interface
 */
export interface IComparisonController {
  comparePrices(req: Request, res: Response, next: NextFunction): Promise<void>;
  getComparisonById(req: Request, res: Response, next: NextFunction): Promise<void>;
  clearCache(req: Request, res: Response, next: NextFunction): Promise<void>;
  getPerformanceMetrics(): {
    cacheSize: number;
    cacheHitRate: number;
    averageProcessingTime: number;
  };
  healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    cacheSize: number;
    serviceAvailable: boolean;
  }>;
}

/**
 * Comparison controller implementation
 */
export class ComparisonController implements IComparisonController {
  private comparisonService: IComparisonService;
  private cache: Map<string, { result: ComparisonResult; expires: number }> = new Map();
  private readonly defaultTTL = 300000; // 5 minutes

  constructor(comparisonService: IComparisonService) {
    this.comparisonService = comparisonService;
  }

  /**
   * Compare prices across platforms
   */
  async comparePrices(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const requestId = req.id;
    const userId = req.user?.id;

    try {
      // Validate request body
      const validatedData = comparisonRequestSchema.parse(req.body);
      
      // Log request
      logger.info('Price comparison request received', {
        requestId,
        userId,
        totalItems: validatedData.items.length,
        platforms: validatedData.preferredPlatforms,
        includePickup: validatedData.includePickup,
        includeGasCalculation: validatedData.includeGasCalculation,
      });

      // Generate cache key
      const cacheKey = this.generateCacheKey(validatedData, userId);
      
      // Check cache first
      const cachedResult = await this.comparisonService.getCachedComparison(cacheKey);
      if (cachedResult) {
        logger.info('Returning cached comparison result', {
          requestId,
          userId,
          cacheKey,
          comparisonId: cachedResult.comparisonId,
        });

        // Update metadata for cached result
        cachedResult.metadata.cacheHit = true;
        cachedResult.metadata.requestId = requestId;
        cachedResult.metadata.userId = userId;

        res.status(200).json(cachedResult);
        return;
      }

      // Create comparison request
      const comparisonRequest: ComparisonRequest = {
        items: validatedData.items,
        location: validatedData.location,
        deliveryAddress: validatedData.deliveryAddress,
        preferredPlatforms: validatedData.preferredPlatforms,
        includePickup: validatedData.includePickup,
        includeGasCalculation: validatedData.includeGasCalculation,
        userPreferences: validatedData.userPreferences,
      };

      // Call comparison service
      const result = await this.comparisonService.comparePrices(comparisonRequest);

      // Cache the result
      await this.comparisonService.cacheComparison(cacheKey, result);

      // Log performance metrics
      const processingTime = Date.now() - startTime;
      logger.info('Price comparison completed', {
        requestId,
        userId,
        comparisonId: result.comparisonId,
        totalPlatforms: result.platforms.length,
        availablePlatforms: result.platforms.filter(p => p.available).length,
        processingTime,
        cacheHit: false,
      });

      // Update metadata
      result.metadata.requestId = requestId;
      result.metadata.userId = userId;
      result.metadata.searchTime = processingTime;

      res.status(200).json(result);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in comparison request', {
          requestId,
          userId,
          errors: error.errors,
          processingTime,
        });

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
          requestId,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.error('Price comparison failed', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      });

      next(error);
    }
  }

  /**
   * Get comparison by ID
   */
  async getComparisonById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.id;
    const userId = req.user?.id;
    const { id } = req.params;

    try {
      // Validate comparison ID
      if (!id || !this.isValidComparisonId(id)) {
        throw createError.validation('Invalid comparison ID format');
      }

      // Check cache for comparison result
      const cacheKey = `comparison_${id}`;
      const cachedResult = await this.comparisonService.getCachedComparison(cacheKey);
      
      if (!cachedResult) {
        throw createError.notFound('Comparison result not found or expired');
      }

      logger.info('Comparison result retrieved', {
        requestId,
        userId,
        comparisonId: id,
      });

      // Update metadata
      cachedResult.metadata.requestId = requestId;
      cachedResult.metadata.userId = userId;

      res.status(200).json(cachedResult);

    } catch (error) {
      logger.error('Failed to retrieve comparison result', {
        requestId,
        userId,
        comparisonId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      next(error);
    }
  }

  /**
   * Clear cache
   */
  async clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.id;
    const userId = req.user?.id;
    const { cacheKey } = req.query;

    try {
      if (cacheKey && typeof cacheKey === 'string') {
        await this.comparisonService.clearCache(cacheKey);
        logger.info('Cache cleared for specific key', {
          requestId,
          userId,
          cacheKey,
        });
      } else {
        await this.comparisonService.clearCache();
        logger.info('All cache cleared', {
          requestId,
          userId,
        });
      }

      res.status(200).json({
        message: 'Cache cleared successfully',
        cacheKey: cacheKey || 'all',
        timestamp: new Date().toISOString(),
        requestId,
      });

    } catch (error) {
      logger.error('Failed to clear cache', {
        requestId,
        userId,
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      next(error);
    }
  }

  /**
   * Generate cache key for comparison request
   */
  private generateCacheKey(data: any, userId?: string): string {
    const keyData = {
      items: data.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      location: {
        lat: Math.round(data.location.lat * 1000) / 1000, // Round to 3 decimal places
        lng: Math.round(data.location.lng * 1000) / 1000,
      },
      deliveryAddress: {
        zipCode: data.deliveryAddress.zipCode,
        city: data.deliveryAddress.city,
        state: data.deliveryAddress.state,
      },
      platforms: data.preferredPlatforms?.sort() || ['doordash', 'ubereats', 'grubhub'],
      includePickup: data.includePickup,
      includeGasCalculation: data.includeGasCalculation,
      preferences: data.userPreferences ? {
        maxDeliveryDistance: data.userPreferences.maxDeliveryDistance,
        mpg: data.userPreferences.mpg,
        gasPrice: data.userPreferences.gasPrice,
      } : undefined,
    };

    const keyString = JSON.stringify(keyData);
    const hash = this.simpleHash(keyString);
    
    return `comparison_${userId || 'anonymous'}_${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate comparison ID format
   */
  private isValidComparisonId(id: string): boolean {
    return /^comp_\d+_[a-z0-9]+$/.test(id);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    cacheHitRate: number;
    averageProcessingTime: number;
  } {
    // TODO: Implement actual metrics collection
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0.0, // Would be calculated from actual metrics
      averageProcessingTime: 0, // Would be calculated from actual metrics
    };
  }

  /**
   * Health check for controller
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    cacheSize: number;
    serviceAvailable: boolean;
  }> {
    try {
      // Test service availability
      const testRequest: ComparisonRequest = {
        items: [{ name: 'Test Item', quantity: 1, price: 10.00 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
      };

      // This would be a lightweight test call
      // For now, just check if service is available
      const serviceAvailable = true; // await this.comparisonService.healthCheck();

      return {
        status: serviceAvailable ? 'healthy' : 'unhealthy',
        cacheSize: this.cache.size,
        serviceAvailable,
      };
    } catch (error) {
      logger.error('Health check failed for comparison controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        status: 'unhealthy',
        cacheSize: this.cache.size,
        serviceAvailable: false,
      };
    }
  }
}

/**
 * Factory function to create comparison controller
 */
export function createComparisonController(comparisonService: IComparisonService): IComparisonController {
  return new ComparisonController(comparisonService);
}

/**
 * Dependency injection container for comparison controller
 */
export class ComparisonControllerContainer {
  private static instance: ComparisonControllerContainer;
  private comparisonService: IComparisonService | null = null;
  private comparisonController: IComparisonController | null = null;

  private constructor() {}

  static getInstance(): ComparisonControllerContainer {
    if (!ComparisonControllerContainer.instance) {
      ComparisonControllerContainer.instance = new ComparisonControllerContainer();
    }
    return ComparisonControllerContainer.instance;
  }

  /**
   * Register comparison service
   */
  registerComparisonService(service: IComparisonService): void {
    this.comparisonService = service;
    logger.info('Comparison service registered in container');
  }

  /**
   * Get comparison controller
   */
  getComparisonController(): IComparisonController {
    if (!this.comparisonController) {
      if (!this.comparisonService) {
        throw new Error('Comparison service not registered. Please register service first.');
      }
      this.comparisonController = createComparisonController(this.comparisonService);
      logger.info('Comparison controller created and registered');
    }
    return this.comparisonController;
  }

  /**
   * Reset container (for testing)
   */
  reset(): void {
    this.comparisonService = null;
    this.comparisonController = null;
    logger.info('Comparison controller container reset');
  }
}

export default ComparisonController;
