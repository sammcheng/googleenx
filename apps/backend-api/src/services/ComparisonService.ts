import { logger } from '@/utils/logger.js';
import { ComparisonOrchestrator, type NormalizedPlatformData } from './ComparisonOrchestrator.js';
import { GasCalculator } from './GasCalculator.js';
import { DoorDashScraper } from './scrapers/DoorDashScraper.js';
import { UberEatsScraper } from './scrapers/UberEatsScraper.js';
import { GrubhubScraper } from './scrapers/GrubhubScraper.js';

/**
 * Comparison request data interface
 */
export interface ComparisonRequest {
  items: CartItem[];
  location: Location;
  deliveryAddress: DeliveryAddress;
  preferredPlatforms?: string[];
  includePickup?: boolean;
  includeGasCalculation?: boolean;
  userPreferences?: UserPreferences;
}

/**
 * Cart item interface
 */
export interface CartItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  modifiers?: string[];
}

/**
 * Location interface
 */
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Delivery address interface
 */
export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  maxDeliveryDistance?: number;
  maxDeliveryTime?: number;
  dietaryRestrictions?: string[];
  priceRange?: string;
  currency?: string;
  mpg?: number;
  gasPrice?: number;
  includeTimeValue?: boolean;
  hourlyRate?: number;
}

/**
 * Platform comparison result interface
 */
export interface PlatformComparison {
  platform: string;
  available: boolean;
  delivery?: DeliveryOption;
  pickup?: PickupOption;
  gasCalculation?: GasCalculation;
}

/**
 * Delivery option interface
 */
export interface DeliveryOption {
  available: boolean;
  price?: number;
  deliveryFee?: number;
  serviceFee?: number;
  tax?: number;
  total?: number;
  estimatedTime?: number;
  restaurant: RestaurantInfo;
}

/**
 * Pickup option interface
 */
export interface PickupOption {
  available: boolean;
  price?: number;
  estimatedTime?: number;
  restaurant: RestaurantInfo;
}

/**
 * Restaurant information interface
 */
export interface RestaurantInfo {
  id: string;
  name: string;
  rating?: number;
  distance?: number;
  cuisine?: string;
}

/**
 * Gas calculation interface
 */
export interface GasCalculation {
  distance: number;
  gasCost: number;
  totalPickupCost: number;
  savings: number;
  isWorthIt: boolean;
}

/**
 * Comparison result interface
 */
export interface ComparisonResult {
  comparisonId: string;
  timestamp: string;
  totalItems: number;
  totalValue: number;
  platforms: PlatformComparison[];
  recommendations: Recommendation[];
  metadata: ComparisonMetadata;
}

/**
 * Recommendation interface
 */
export interface Recommendation {
  platform: string;
  reason: string;
  savings?: number;
  timeSavings?: number;
  confidence: number;
}

/**
 * Comparison metadata interface
 */
export interface ComparisonMetadata {
  searchRadius: number;
  searchTime: number;
  cacheHit: boolean;
  requestId: string;
  userId?: string;
}

/**
 * Comparison service interface
 */
export interface IComparisonService {
  comparePrices(request: ComparisonRequest): Promise<ComparisonResult>;
  getCachedComparison(cacheKey: string): Promise<ComparisonResult | null>;
  cacheComparison(cacheKey: string, result: ComparisonResult, ttl?: number): Promise<void>;
  clearCache(cacheKey?: string): Promise<void>;
}

/**
 * Comparison service implementation
 */
export class ComparisonService implements IComparisonService {
  private cache: Map<string, { result: ComparisonResult; expires: number }> = new Map();
  private readonly defaultTTL = 300000; // 5 minutes
  private readonly orchestrator: ComparisonOrchestrator;

  constructor() {
    this.orchestrator = new ComparisonOrchestrator(new GasCalculator());
    this.orchestrator.registerScraper(new DoorDashScraper({}));
    this.orchestrator.registerScraper(new UberEatsScraper({}));
    this.orchestrator.registerScraper(new GrubhubScraper({}));
  }

  /**
   * Compare prices across platforms
   */
  async comparePrices(request: ComparisonRequest): Promise<ComparisonResult> {
    try {
      logger.info('Starting price comparison', {
        totalItems: request.items.length,
        platforms: request.preferredPlatforms,
        includePickup: request.includePickup,
        includeGasCalculation: request.includeGasCalculation,
      });

      const orchestratedResult = await this.orchestrator.comparePrices(request);
      const platforms = orchestratedResult.platforms.map((platform) => this.mapPlatformResult(platform));
      const recommendations = orchestratedResult.recommendations.map((recommendation) => ({
        platform: recommendation.platform,
        reason: recommendation.reason,
        savings: recommendation.savings,
        timeSavings: recommendation.timeSavings,
        confidence: recommendation.confidence,
      }));

      const result: ComparisonResult = {
        comparisonId: orchestratedResult.comparisonId,
        timestamp: orchestratedResult.timestamp,
        totalItems: orchestratedResult.totalItems,
        totalValue: orchestratedResult.totalValue,
        platforms,
        recommendations,
        metadata: {
          searchRadius: request.userPreferences?.maxDeliveryDistance || 10,
          searchTime: orchestratedResult.metadata.responseTime,
          cacheHit: false,
          requestId: orchestratedResult.comparisonId,
        },
      };

      logger.info('Price comparison completed', {
        comparisonId: result.comparisonId,
        totalPlatforms: platforms.length,
        availablePlatforms: platforms.filter(p => p.available).length,
        searchTime: result.metadata.searchTime,
      });

      return result;
    } catch (error) {
      logger.error('Price comparison failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private mapPlatformResult(platform: NormalizedPlatformData): PlatformComparison {
    return {
      platform: platform.platform,
      available: platform.available,
      delivery: platform.delivery ? {
        available: platform.delivery.available,
        price: platform.delivery.price,
        deliveryFee: platform.delivery.deliveryFee,
        serviceFee: platform.delivery.serviceFee,
        tax: platform.delivery.tax,
        total: platform.delivery.total,
        estimatedTime: platform.delivery.estimatedTime,
        restaurant: {
          id: platform.restaurant.id,
          name: platform.restaurant.name,
          rating: platform.restaurant.rating,
          distance: platform.restaurant.distance,
          cuisine: platform.restaurant.cuisine,
        },
      } : undefined,
      pickup: platform.pickup ? {
        available: platform.pickup.available,
        price: platform.pickup.price,
        estimatedTime: platform.pickup.estimatedTime,
        restaurant: {
          id: platform.restaurant.id,
          name: platform.restaurant.name,
          rating: platform.restaurant.rating,
          distance: platform.restaurant.distance,
          cuisine: platform.restaurant.cuisine,
        },
      } : undefined,
      gasCalculation: platform.gasCalculation ? {
        distance: platform.gasCalculation.distance,
        gasCost: platform.gasCalculation.gasCost,
        totalPickupCost: platform.gasCalculation.totalPickupCost,
        savings: platform.gasCalculation.savings,
        isWorthIt: platform.gasCalculation.isWorthIt,
      } : undefined,
    };
  }

  /**
   * Get platform comparisons
   */
  private async getPlatformComparisons(request: ComparisonRequest): Promise<PlatformComparison[]> {
    const platforms = request.preferredPlatforms || ['doordash', 'ubereats', 'grubhub'];
    const comparisons: PlatformComparison[] = [];

    for (const platform of platforms) {
      try {
        const comparison = await this.getPlatformComparison(platform, request);
        comparisons.push(comparison);
      } catch (error) {
        logger.warn('Platform comparison failed', {
          platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        // Add unavailable platform
        comparisons.push({
          platform,
          available: false,
        });
      }
    }

    return comparisons;
  }

  /**
   * Get comparison for specific platform
   */
  private async getPlatformComparison(platform: string, request: ComparisonRequest): Promise<PlatformComparison> {
    // TODO: Implement actual platform API calls
    // This would typically:
    // 1. Call platform API to search for restaurants
    // 2. Get menu items and prices
    // 3. Calculate delivery fees and taxes
    // 4. Get estimated delivery times

    // Mock implementation for now
    const mockComparison: PlatformComparison = {
      platform,
      available: true,
      delivery: {
        available: true,
        price: request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryFee: this.getRandomDeliveryFee(platform),
        serviceFee: this.getRandomServiceFee(platform),
        tax: this.getRandomTax(platform),
        total: 0, // Will be calculated
        estimatedTime: this.getRandomDeliveryTime(platform),
        restaurant: {
          id: `rest_${platform}_1`,
          name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Restaurant`,
          rating: 4.0 + Math.random(),
          distance: 0.5 + Math.random() * 2,
          cuisine: 'Italian',
        },
      },
      pickup: request.includePickup ? {
        available: true,
        price: request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        estimatedTime: 15 + Math.random() * 10,
        restaurant: {
          id: `rest_${platform}_1`,
          name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Restaurant`,
          rating: 4.0 + Math.random(),
          distance: 0.5 + Math.random() * 2,
          cuisine: 'Italian',
        },
      } : undefined,
    };

    // Calculate totals
    if (mockComparison.delivery) {
      mockComparison.delivery.total = (mockComparison.delivery.price || 0) + 
        (mockComparison.delivery.deliveryFee || 0) + 
        (mockComparison.delivery.serviceFee || 0) + 
        (mockComparison.delivery.tax || 0);
    }

    // Add gas calculation if requested
    if (request.includeGasCalculation && mockComparison.pickup && request.userPreferences) {
      mockComparison.gasCalculation = this.calculateGasCost(
        mockComparison.pickup,
        request.userPreferences,
        request.location
      );
    }

    return mockComparison;
  }

  /**
   * Calculate gas cost for pickup
   */
  private calculateGasCost(
    pickup: PickupOption,
    preferences: UserPreferences,
    location: Location
  ): GasCalculation {
    const distance = (pickup.restaurant.distance || 0) * 2; // Round trip
    const mpg = preferences.mpg || 25;
    const gasPrice = preferences.gasPrice || 3.50;
    const gasCost = (distance * gasPrice) / mpg;
    const totalPickupCost = (pickup.price || 0) + gasCost;
    const deliveryCost = (pickup.price || 0) + 5.00; // Mock delivery cost
    const savings = deliveryCost - totalPickupCost;

    return {
      distance,
      gasCost: Math.round(gasCost * 100) / 100,
      totalPickupCost: Math.round(totalPickupCost * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      isWorthIt: savings > 0,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    platforms: PlatformComparison[],
    request: ComparisonRequest
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const availablePlatforms = platforms.filter(p => p.available && p.delivery?.available);

    if (availablePlatforms.length === 0) {
      return recommendations;
    }

    // Find best delivery option
    const bestDelivery = availablePlatforms.reduce((best, current) => {
      const currentTotal = current.delivery?.total || Infinity;
      const bestTotal = best.delivery?.total || Infinity;
      return currentTotal < bestTotal ? current : best;
    });

    if (bestDelivery.delivery) {
      const savings = availablePlatforms
        .filter(p => p.delivery?.total && p.delivery.total > bestDelivery.delivery!.total!)
        .reduce((sum, p) => sum + ((p.delivery?.total || 0) - (bestDelivery.delivery?.total || 0)), 0);

      recommendations.push({
        platform: bestDelivery.platform,
        reason: `Best delivery value with lowest total cost`,
        savings: Math.round(savings * 100) / 100,
        confidence: 0.9,
      });
    }

    // Find best pickup option if available
    const pickupPlatforms = platforms.filter(p => p.available && p.pickup?.available);
    if (pickupPlatforms.length > 0 && request.includePickup) {
      const bestPickup = pickupPlatforms.reduce((best, current) => {
        const currentTotal = current.pickup?.price || Infinity;
        const bestTotal = best.pickup?.price || Infinity;
        return currentTotal < bestTotal ? current : best;
      });

      if (bestPickup.pickup) {
        const deliverySavings = availablePlatforms
          .filter(p => p.delivery?.total)
          .reduce((sum, p) => sum + ((p.delivery?.total || 0) - (bestPickup.pickup?.price || 0)), 0);

        recommendations.push({
          platform: bestPickup.platform,
          reason: `Best pickup value with potential savings`,
          savings: Math.round(deliverySavings * 100) / 100,
          confidence: 0.8,
        });
      }
    }

    return recommendations;
  }

  /**
   * Get cached comparison result
   */
  async getCachedComparison(cacheKey: string): Promise<ComparisonResult | null> {
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expires) {
      this.cache.delete(cacheKey);
      return null;
    }

    logger.info('Cache hit for comparison', { cacheKey });
    return cached.result;
  }

  /**
   * Cache comparison result
   */
  async cacheComparison(cacheKey: string, result: ComparisonResult, ttl?: number): Promise<void> {
    const expires = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(cacheKey, { result, expires });
    
    logger.info('Comparison result cached', { 
      cacheKey, 
      ttl: ttl || this.defaultTTL,
      expires: new Date(expires).toISOString(),
    });
  }

  /**
   * Clear cache
   */
  async clearCache(cacheKey?: string): Promise<void> {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      logger.info('Cache cleared for specific key', { cacheKey });
    } else {
      this.cache.clear();
      logger.info('All cache cleared');
    }
  }

  /**
   * Generate comparison ID
   */
  private generateComparisonId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get random delivery fee based on platform
   */
  private getRandomDeliveryFee(platform: string): number {
    const fees = {
      doordash: 2.99,
      ubereats: 3.99,
      grubhub: 2.50,
    };
    return fees[platform as keyof typeof fees] || 3.00;
  }

  /**
   * Get random service fee based on platform
   */
  private getRandomServiceFee(platform: string): number {
    const fees = {
      doordash: 2.50,
      ubereats: 3.00,
      grubhub: 2.00,
    };
    return fees[platform as keyof typeof fees] || 2.50;
  }

  /**
   * Get random tax based on platform
   */
  private getRandomTax(platform: string): number {
    return 1.50 + Math.random() * 1.00;
  }

  /**
   * Get random delivery time based on platform
   */
  private getRandomDeliveryTime(platform: string): number {
    const times = {
      doordash: 35,
      ubereats: 30,
      grubhub: 40,
    };
    return times[platform as keyof typeof times] || 35;
  }
}
