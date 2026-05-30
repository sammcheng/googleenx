import { logger } from '@/utils/logger.js';
import type { IPlatformScraper, ScraperResult, PlatformData, CartData, Location, UserPreferences } from './scrapers/PlatformScraper.js';
import type { IGasCalculator, GasCalculationResult } from './GasCalculator.js';

/**
 * Comparison request interface
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
 * Normalized platform data interface
 */
export interface NormalizedPlatformData {
  platform: string;
  available: boolean;
  restaurant: NormalizedRestaurantInfo;
  delivery?: NormalizedDeliveryOption;
  pickup?: NormalizedPickupOption;
  gasCalculation?: GasCalculationResult;
  specialOffers?: NormalizedSpecialOffer[];
  error?: string;
  metadata: ComparisonMetadata;
}

/**
 * Normalized restaurant info interface
 */
export interface NormalizedRestaurantInfo {
  id: string;
  name: string;
  rating?: number;
  distance?: number;
  cuisine?: string;
  address?: string;
  phone?: string;
  hours?: string;
  deliveryFee?: number;
  minimumOrder?: number;
}

/**
 * Normalized delivery option interface
 */
export interface NormalizedDeliveryOption {
  available: boolean;
  price: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  total: number;
  estimatedTime: number;
  minimumOrder?: number;
  freeDeliveryThreshold?: number;
  deliveryRadius?: number;
}

/**
 * Normalized pickup option interface
 */
export interface NormalizedPickupOption {
  available: boolean;
  price: number;
  estimatedTime: number;
  minimumOrder?: number;
  pickupLocation?: string;
}

/**
 * Normalized special offer interface
 */
export interface NormalizedSpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed' | 'free_delivery';
  minimumOrder?: number;
  validUntil?: string;
  terms?: string;
}

/**
 * Comparison metadata interface
 */
export interface ComparisonMetadata {
  scrapedAt: string;
  responseTime: number;
  cacheHit: boolean;
  retryCount: number;
  errorCount: number;
  dataQuality: 'high' | 'medium' | 'low';
  lastUpdated?: string;
  platform: string;
}

/**
 * Best deal analysis interface
 */
export interface BestDealAnalysis {
  bestDelivery: NormalizedPlatformData | null;
  bestPickup: NormalizedPlatformData | null;
  bestOverall: NormalizedPlatformData | null;
  savings: {
    delivery: number;
    pickup: number;
    overall: number;
  };
  recommendations: DealRecommendation[];
  confidence: number;
}

/**
 * Deal recommendation interface
 */
export interface DealRecommendation {
  platform: string;
  reason: string;
  savings: number;
  timeSavings?: number;
  confidence: number;
  type: 'delivery' | 'pickup' | 'mixed';
  conditions: string[];
}

/**
 * Comparison result interface
 */
export interface ComparisonResult {
  comparisonId: string;
  timestamp: string;
  totalItems: number;
  totalValue: number;
  platforms: NormalizedPlatformData[];
  bestDeal: BestDealAnalysis;
  recommendations: DealRecommendation[];
  metadata: ComparisonMetadata;
}

/**
 * Comparison orchestrator service interface
 */
export interface IComparisonOrchestrator {
  comparePrices(request: ComparisonRequest): Promise<ComparisonResult>;
  registerScraper(scraper: IPlatformScraper): void;
  unregisterScraper(platform: string): void;
  getRegisteredScrapers(): string[];
  healthCheck(): Promise<boolean>;
}

/**
 * Comparison orchestrator service implementation
 */
export class ComparisonOrchestrator implements IComparisonOrchestrator {
  private scrapers: Map<string, IPlatformScraper> = new Map();
  private gasCalculator: IGasCalculator;
  private readonly logger = logger;
  private readonly defaultTimeout = 15000; // 15 seconds
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(gasCalculator: IGasCalculator) {
    this.gasCalculator = gasCalculator;
  }

  /**
   * Main comparison method
   */
  async comparePrices(request: ComparisonRequest): Promise<ComparisonResult> {
    const startTime = Date.now();
    const comparisonId = this.generateComparisonId();
    
    try {
      this.logger.info('Starting price comparison orchestration', {
        comparisonId,
        totalItems: request.items.length,
        platforms: request.preferredPlatforms,
        includePickup: request.includePickup,
        includeGasCalculation: request.includeGasCalculation,
      });

      // Calculate total value
      const totalValue = request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Get platform scrapers
      const scrapers = this.getScrapersForRequest(request);
      
      if (scrapers.length === 0) {
        throw new Error('No scrapers available for comparison');
      }

      // Execute scrapers in parallel with timeout
      const scraperResults = await this.executeScrapersInParallel(
        scrapers,
        request,
        this.defaultTimeout
      );

      // Normalize data from all platforms
      const normalizedData = await this.normalizePlatformData(scraperResults, request);

      // Calculate gas costs for pickup options
      if (request.includeGasCalculation && request.includePickup) {
        await this.calculateGasCosts(normalizedData, request);
      }

      // Determine best deals
      const bestDeal = this.analyzeBestDeals(normalizedData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(normalizedData, bestDeal);

      const result: ComparisonResult = {
        comparisonId,
        timestamp: new Date().toISOString(),
        totalItems: request.items.length,
        totalValue,
        platforms: normalizedData,
        bestDeal,
        recommendations,
        metadata: {
          scrapedAt: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          cacheHit: false,
          retryCount: 0,
          errorCount: scraperResults.filter(r => !r.success).length,
          dataQuality: this.assessOverallDataQuality(normalizedData),
          platform: 'orchestrator',
        },
      };

      this.logger.info('Price comparison orchestration completed', {
        comparisonId,
        totalPlatforms: normalizedData.length,
        availablePlatforms: normalizedData.filter(p => p.available).length,
        responseTime: result.metadata.responseTime,
        dataQuality: result.metadata.dataQuality,
      });

      return result;
    } catch (error) {
      this.logger.error('Price comparison orchestration failed', {
        comparisonId,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Register a platform scraper
   */
  registerScraper(scraper: IPlatformScraper): void {
    this.scrapers.set(scraper.platform, scraper);
    this.logger.info('Platform scraper registered', {
      platform: scraper.platform,
      totalScrapers: this.scrapers.size,
    });
  }

  /**
   * Unregister a platform scraper
   */
  unregisterScraper(platform: string): void {
    const removed = this.scrapers.delete(platform);
    if (removed) {
      this.logger.info('Platform scraper unregistered', {
        platform,
        totalScrapers: this.scrapers.size,
      });
    }
  }

  /**
   * Get list of registered scrapers
   */
  getRegisteredScrapers(): string[] {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Health check for all scrapers
   */
  async healthCheck(): Promise<boolean> {
    try {
      const healthChecks = await Promise.allSettled(
        Array.from(this.scrapers.values()).map(scraper => scraper.healthCheck())
      );

      const healthyScrapers = healthChecks.filter(
        result => result.status === 'fulfilled' && result.value === true
      ).length;

      const totalScrapers = this.scrapers.size;
      const healthRatio = totalScrapers > 0 ? healthyScrapers / totalScrapers : 0;

      this.logger.info('Health check completed', {
        totalScrapers,
        healthyScrapers,
        healthRatio,
      });

      return healthRatio >= 0.5; // At least 50% of scrapers must be healthy
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Execute scrapers in parallel with timeout
   */
  private async executeScrapersInParallel(
    scrapers: IPlatformScraper[],
    request: ComparisonRequest,
    timeout: number
  ): Promise<ScraperResult[]> {
    const cartData: CartData = {
      items: request.items,
      deliveryAddress: request.deliveryAddress,
      userPreferences: request.userPreferences,
    };

    const scraperPromises = scrapers.map(async (scraper) => {
      try {
        this.logger.debug('Starting scraper execution', {
          platform: scraper.platform,
          timeout,
        });

        const result = await Promise.race([
          scraper.scrape(cartData, request.location),
          this.createTimeoutPromise(timeout, scraper.platform),
        ]);

        this.logger.debug('Scraper execution completed', {
          platform: scraper.platform,
          success: result.success,
          duration: result.metadata.duration,
        });

        return result;
      } catch (error) {
        this.logger.error('Scraper execution failed', {
          platform: scraper.platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            platform: scraper.platform,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            retryCount: 0,
            cacheHit: false,
            dataQuality: 'low',
            errorCount: 1,
          },
        };
      }
    });

    return Promise.all(scraperPromises);
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number, platform: string): Promise<ScraperResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Scraper timeout after ${timeout}ms for platform ${platform}`));
      }, timeout);
    });
  }

  /**
   * Normalize platform data
   */
  private async normalizePlatformData(
    scraperResults: ScraperResult[],
    request: ComparisonRequest
  ): Promise<NormalizedPlatformData[]> {
    const normalizedData: NormalizedPlatformData[] = [];

    for (const result of scraperResults) {
      if (result.success && result.data) {
        const normalized = this.normalizeSinglePlatformData(result.data, result.metadata);
        normalizedData.push(normalized);
      } else {
        // Create error entry for failed scrapers
        const errorData: NormalizedPlatformData = {
          platform: result.metadata.platform,
          available: false,
          restaurant: {
            id: '',
            name: 'Unknown Restaurant',
          },
          error: result.error || 'Scraper failed',
          metadata: {
            scrapedAt: new Date().toISOString(),
            responseTime: result.metadata.duration,
            cacheHit: result.metadata.cacheHit,
            retryCount: result.metadata.retryCount,
            errorCount: result.metadata.errorCount,
            dataQuality: result.metadata.dataQuality,
            platform: result.metadata.platform,
          },
        };
        normalizedData.push(errorData);
      }
    }

    return normalizedData;
  }

  /**
   * Normalize single platform data
   */
  private normalizeSinglePlatformData(
    data: PlatformData,
    metadata: any
  ): NormalizedPlatformData {
    return {
      platform: data.platform,
      available: data.available,
      restaurant: {
        id: data.restaurant.id,
        name: data.restaurant.name,
        rating: data.restaurant.rating,
        distance: data.restaurant.distance,
        cuisine: data.restaurant.cuisine,
        address: data.restaurant.address,
        phone: data.restaurant.phone,
        hours: data.restaurant.hours,
        deliveryFee: data.restaurant.deliveryFee,
        minimumOrder: data.restaurant.minimumOrder,
      },
      delivery: data.delivery ? {
        available: data.delivery.available,
        price: data.delivery.price,
        deliveryFee: data.delivery.deliveryFee,
        serviceFee: data.delivery.serviceFee,
        tax: data.delivery.tax,
        tip: data.delivery.tip,
        total: data.delivery.total,
        estimatedTime: data.delivery.estimatedTime,
        minimumOrder: data.delivery.minimumOrder,
        freeDeliveryThreshold: data.delivery.freeDeliveryThreshold,
        deliveryRadius: data.delivery.deliveryRadius,
      } : undefined,
      pickup: data.pickup ? {
        available: data.pickup.available,
        price: data.pickup.price,
        estimatedTime: data.pickup.estimatedTime,
        minimumOrder: data.pickup.minimumOrder,
        pickupLocation: data.pickup.pickupLocation,
      } : undefined,
      specialOffers: data.specialOffers?.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        discount: offer.discount,
        type: offer.type,
        minimumOrder: offer.minimumOrder,
        validUntil: offer.validUntil,
        terms: offer.terms,
      })),
      metadata: {
        scrapedAt: new Date().toISOString(),
        responseTime: metadata.duration,
        cacheHit: metadata.cacheHit,
        retryCount: metadata.retryCount,
        errorCount: metadata.errorCount,
        dataQuality: metadata.dataQuality,
        platform: data.platform,
      },
    };
  }

  /**
   * Calculate gas costs for pickup options
   */
  private async calculateGasCosts(
    platforms: NormalizedPlatformData[],
    request: ComparisonRequest
  ): Promise<void> {
    for (const platform of platforms) {
      if (platform.pickup?.available && request.userPreferences) {
        try {
          const gasCalculation = await this.gasCalculator.calculateGasCost(
            platform.pickup,
            request.location,
            request.userPreferences,
            platform.delivery?.total
          );

          platform.gasCalculation = this.applyDistanceFallback(
            gasCalculation,
            platform,
            request,
          );
          
          this.logger.debug('Gas calculation completed', {
            platform: platform.platform,
            gasCost: gasCalculation.gasCost,
            totalPickupCost: gasCalculation.totalPickupCost,
            savings: gasCalculation.savings,
          });
        } catch (error) {
          this.logger.warn('Gas calculation failed', {
            platform: platform.platform,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }

  private applyDistanceFallback(
    gasCalculation: GasCalculationResult,
    platform: NormalizedPlatformData,
    request: ComparisonRequest,
  ): GasCalculationResult {
    const restaurantDistance = platform.restaurant.distance;

    if (!restaurantDistance || gasCalculation.distance > 0 || !platform.pickup) {
      return gasCalculation;
    }

    const mpg = request.userPreferences?.mpg || 25;
    const gasPrice = request.userPreferences?.gasPrice || 3.5;
    const roundTripDistance = restaurantDistance * 2;
    const gasCost = Number(((roundTripDistance * gasPrice) / mpg).toFixed(2));
    const totalPickupCost = Number((platform.pickup.price + gasCost).toFixed(2));
    const deliveryCost = platform.delivery?.total || platform.pickup.price;
    const savings = Number((deliveryCost - totalPickupCost).toFixed(2));

    return {
      ...gasCalculation,
      distance: Number(roundTripDistance.toFixed(2)),
      gasCost,
      totalPickupCost,
      savings,
      isWorthIt: savings > 0,
      totalValue: totalPickupCost,
      breakdown: {
        ...gasCalculation.breakdown,
        distance: Number(roundTripDistance.toFixed(2)),
        mpg,
        gasPrice,
        gasCost,
        totalCost: totalPickupCost,
        deliveryCost,
        savings,
        totalValue: totalPickupCost,
      },
    };
  }

  /**
   * Analyze best deals
   */
  private analyzeBestDeals(platforms: NormalizedPlatformData[]): BestDealAnalysis {
    const availablePlatforms = platforms.filter(p => p.available);
    const deliveryPlatforms = availablePlatforms.filter(p => p.delivery?.available);
    const pickupPlatforms = availablePlatforms.filter(p => p.pickup?.available);

    // Find best delivery option
    const bestDelivery = deliveryPlatforms.reduce((best, current) => {
      const currentTotal = current.delivery?.total || Infinity;
      const bestTotal = best.delivery?.total || Infinity;
      return currentTotal < bestTotal ? current : best;
    }, deliveryPlatforms[0] || null);

    // Find best pickup option
    const bestPickup = pickupPlatforms.reduce((best, current) => {
      const currentTotal = current.pickup?.price || Infinity;
      const bestTotal = best.pickup?.price || Infinity;
      return currentTotal < bestTotal ? current : best;
    }, pickupPlatforms[0] || null);

    // Find best overall option
    const allOptions = [
      ...deliveryPlatforms.map(p => ({ platform: p, type: 'delivery' as const, total: p.delivery?.total || Infinity })),
      ...pickupPlatforms.map(p => ({ platform: p, type: 'pickup' as const, total: p.pickup?.price || Infinity })),
    ];

    const bestOverall = allOptions.reduce((best, current) => {
      return current.total < best.total ? current : best;
    }, allOptions[0] || { platform: null, type: 'delivery' as const, total: Infinity });

    // Calculate savings
    const deliverySavings = bestDelivery ? 
      deliveryPlatforms
        .filter(p => p.delivery?.total && p.delivery.total > bestDelivery.delivery!.total)
        .reduce((sum, p) => sum + ((p.delivery?.total || 0) - (bestDelivery.delivery?.total || 0)), 0) : 0;

    const pickupSavings = bestPickup ? 
      pickupPlatforms
        .filter(p => p.pickup?.price && p.pickup.price > bestPickup.pickup!.price)
        .reduce((sum, p) => sum + ((p.pickup?.price || 0) - (bestPickup.pickup?.price || 0)), 0) : 0;

    const overallSavings = bestOverall.platform ? 
      allOptions
        .filter(o => o.total > bestOverall.total)
        .reduce((sum, o) => sum + (o.total - bestOverall.total), 0) : 0;

    return {
      bestDelivery,
      bestPickup,
      bestOverall: bestOverall.platform,
      savings: {
        delivery: Math.round(deliverySavings * 100) / 100,
        pickup: Math.round(pickupSavings * 100) / 100,
        overall: Math.round(overallSavings * 100) / 100,
      },
      recommendations: [],
      confidence: this.calculateConfidence(platforms),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    platforms: NormalizedPlatformData[],
    bestDeal: BestDealAnalysis
  ): DealRecommendation[] {
    const recommendations: DealRecommendation[] = [];

    if (bestDeal.bestDelivery) {
      recommendations.push({
        platform: bestDeal.bestDelivery.platform,
        reason: 'Best delivery value with lowest total cost',
        savings: bestDeal.savings.delivery,
        confidence: 0.9,
        type: 'delivery',
        conditions: ['Lowest total cost', 'Delivery available'],
      });
    }

    if (bestDeal.bestPickup) {
      recommendations.push({
        platform: bestDeal.bestPickup.platform,
        reason: 'Best pickup value with potential savings',
        savings: bestDeal.savings.pickup,
        confidence: 0.8,
        type: 'pickup',
        conditions: ['Pickup available', 'Consider gas cost'],
      });
    }

    if (bestDeal.bestOverall) {
      recommendations.push({
        platform: bestDeal.bestOverall.platform,
        reason: 'Best overall value across all options',
        savings: bestDeal.savings.overall,
        confidence: 0.95,
        type: 'mixed',
        conditions: ['Best overall value', 'Consider all factors'],
      });
    }

    return recommendations;
  }

  /**
   * Get scrapers for request
   */
  private getScrapersForRequest(request: ComparisonRequest): IPlatformScraper[] {
    const preferredPlatforms = request.preferredPlatforms || Array.from(this.scrapers.keys());
    return preferredPlatforms
      .map(platform => this.scrapers.get(platform))
      .filter((scraper): scraper is IPlatformScraper => scraper !== undefined);
  }

  /**
   * Assess overall data quality
   */
  private assessOverallDataQuality(platforms: NormalizedPlatformData[]): 'high' | 'medium' | 'low' {
    if (platforms.length === 0) return 'low';
    
    const qualityScores = platforms.map(p => {
      switch (p.metadata.dataQuality) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
      }
    });
    
    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    if (averageQuality >= 2.5) return 'high';
    if (averageQuality >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(platforms: NormalizedPlatformData[]): number {
    const availablePlatforms = platforms.filter(p => p.available);
    const totalPlatforms = platforms.length;
    
    if (totalPlatforms === 0) return 0;
    
    const availabilityRatio = availablePlatforms.length / totalPlatforms;
    const qualityScore = this.assessOverallDataQuality(platforms);
    
    const qualityMultiplier = qualityScore === 'high' ? 1.0 : qualityScore === 'medium' ? 0.7 : 0.4;
    
    return Math.round((availabilityRatio * qualityMultiplier) * 100) / 100;
  }

  /**
   * Generate comparison ID
   */
  private generateComparisonId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
