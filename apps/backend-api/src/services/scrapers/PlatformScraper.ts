import { logger } from '@/utils/logger.js';

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
 * Restaurant information interface
 */
export interface RestaurantInfo {
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
 * Menu item interface
 */
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  modifiers?: MenuModifier[];
  imageUrl?: string;
  nutritionInfo?: NutritionInfo;
}

/**
 * Menu modifier interface
 */
export interface MenuModifier {
  id: string;
  name: string;
  price: number;
  required: boolean;
  options?: ModifierOption[];
}

/**
 * Modifier option interface
 */
export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

/**
 * Nutrition information interface
 */
export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

/**
 * Delivery option interface
 */
export interface DeliveryOption {
  available: boolean;
  price: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  total: number;
  estimatedTime: number; // in minutes
  minimumOrder?: number;
  freeDeliveryThreshold?: number;
  deliveryRadius?: number;
}

/**
 * Pickup option interface
 */
export interface PickupOption {
  available: boolean;
  price: number;
  estimatedTime: number; // in minutes
  minimumOrder?: number;
  pickupLocation?: string;
}

/**
 * Platform-specific data interface
 */
export interface PlatformData {
  platform: string;
  available: boolean;
  restaurant: RestaurantInfo;
  delivery?: DeliveryOption;
  pickup?: PickupOption;
  menuItems?: MenuItem[];
  specialOffers?: SpecialOffer[];
  error?: string;
  metadata?: PlatformMetadata;
}

/**
 * Special offer interface
 */
export interface SpecialOffer {
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
 * Platform metadata interface
 */
export interface PlatformMetadata {
  scrapedAt: string;
  responseTime: number;
  cacheHit: boolean;
  retryCount: number;
  errorCount: number;
  dataQuality: 'high' | 'medium' | 'low';
  lastUpdated?: string;
}

/**
 * Scraper configuration interface
 */
export interface ScraperConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  userAgent?: string;
  headers?: Record<string, string>;
  proxy?: string;
  rateLimit?: number;
}

/**
 * Scraper result interface
 */
export interface ScraperResult {
  success: boolean;
  data?: PlatformData;
  error?: string;
  metadata: ScraperMetadata;
}

/**
 * Scraper metadata interface
 */
export interface ScraperMetadata {
  platform: string;
  startTime: number;
  endTime: number;
  duration: number;
  retryCount: number;
  cacheHit: boolean;
  dataQuality: 'high' | 'medium' | 'low';
  errorCount: number;
}

/**
 * Base platform scraper interface
 */
export interface IPlatformScraper {
  platform: string;
  config: ScraperConfig;
  
  scrape(cartData: CartData, location: Location): Promise<ScraperResult>;
  healthCheck(): Promise<boolean>;
  getConfig(): ScraperConfig;
  updateConfig(config: Partial<ScraperConfig>): void;
}

/**
 * Cart data interface
 */
export interface CartData {
  items: CartItem[];
  deliveryAddress: DeliveryAddress;
  userPreferences?: UserPreferences;
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
 * Abstract base platform scraper
 */
export abstract class BasePlatformScraper implements IPlatformScraper {
  public readonly platform: string;
  public config: ScraperConfig;
  protected logger = logger;

  constructor(platform: string, config: ScraperConfig) {
    this.platform = platform;
    this.config = config;
  }

  /**
   * Main scraping method
   */
  async scrape(cartData: CartData, location: Location): Promise<ScraperResult> {
    const startTime = Date.now();
    let retryCount = 0;
    let errorCount = 0;
    let lastError: Error | null = null;

    this.logger.info(`Starting scrape for ${this.platform}`, {
      platform: this.platform,
      itemCount: cartData.items.length,
      location,
    });

    while (retryCount < this.config.retries) {
      try {
        const result = await this.executeScrape(cartData, location);
        
        this.logger.info(`Scrape completed for ${this.platform}`, {
          platform: this.platform,
          duration: Date.now() - startTime,
          retryCount,
          success: true,
        });

        return {
          success: true,
          data: result,
          metadata: {
            platform: this.platform,
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
            retryCount,
            cacheHit: false,
            dataQuality: this.assessDataQuality(result),
            errorCount,
          },
        };
      } catch (error) {
        retryCount++;
        errorCount++;
        lastError = error instanceof Error ? error : new Error('Unknown error');

        this.logger.warn(`Scrape attempt ${retryCount} failed for ${this.platform}`, {
          platform: this.platform,
          attempt: retryCount,
          error: lastError.message,
          duration: Date.now() - startTime,
        });

        if (retryCount < this.config.retries) {
          await this.delay(this.config.retryDelay * retryCount);
        }
      }
    }

    this.logger.error(`All scrape attempts failed for ${this.platform}`, {
      platform: this.platform,
      totalAttempts: this.config.retries,
      lastError: lastError?.message,
      duration: Date.now() - startTime,
    });

    return {
      success: false,
      error: lastError?.message || 'All retry attempts failed',
      metadata: {
        platform: this.platform,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        retryCount,
        cacheHit: false,
        dataQuality: 'low',
        errorCount,
      },
    };
  }

  /**
   * Abstract method to implement platform-specific scraping logic
   */
  protected abstract executeScrape(cartData: CartData, location: Location): Promise<PlatformData>;

  /**
   * Health check for the scraper
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Implement basic health check
      return await this.performHealthCheck();
    } catch (error) {
      this.logger.error(`Health check failed for ${this.platform}`, {
        platform: this.platform,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Abstract method for platform-specific health check
   */
  protected abstract performHealthCheck(): Promise<boolean>;

  /**
   * Get scraper configuration
   */
  getConfig(): ScraperConfig {
    return { ...this.config };
  }

  /**
   * Update scraper configuration
   */
  updateConfig(config: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info(`Configuration updated for ${this.platform}`, {
      platform: this.platform,
      config: this.config,
    });
  }

  /**
   * Assess data quality based on scraped data
   */
  protected assessDataQuality(data: PlatformData): 'high' | 'medium' | 'low' {
    if (!data.available) return 'low';
    
    let qualityScore = 0;
    
    // Check restaurant info completeness
    if (data.restaurant.name) qualityScore += 1;
    if (data.restaurant.rating) qualityScore += 1;
    if (data.restaurant.distance) qualityScore += 1;
    
    // Check delivery option completeness
    if (data.delivery?.available) {
      if (data.delivery.price > 0) qualityScore += 1;
      if (data.delivery.estimatedTime > 0) qualityScore += 1;
      if (data.delivery.total > 0) qualityScore += 1;
    }
    
    // Check pickup option completeness
    if (data.pickup?.available) {
      if (data.pickup.price > 0) qualityScore += 1;
      if (data.pickup.estimatedTime > 0) qualityScore += 1;
    }
    
    // Check menu items
    if (data.menuItems && data.menuItems.length > 0) qualityScore += 1;
    
    if (qualityScore >= 6) return 'high';
    if (qualityScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Delay utility
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Timeout wrapper for async operations
   */
  protected withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Validate scraped data
   */
  protected validateData(data: PlatformData): boolean {
    if (!data.platform || !data.restaurant) return false;
    if (!data.restaurant.name) return false;
    if (data.delivery && !data.delivery.available && data.delivery.total > 0) return false;
    if (data.pickup && !data.pickup.available && data.pickup.price > 0) return false;
    return true;
  }

  /**
   * Normalize price data
   */
  protected normalizePrice(price: number | string): number {
    if (typeof price === 'string') {
      // Remove currency symbols and parse
      const cleaned = price.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return price;
  }

  /**
   * Normalize time data
   */
  protected normalizeTime(time: number | string): number {
    if (typeof time === 'string') {
      // Extract numbers from time strings like "30-45 min"
      const match = time.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return time;
  }

  /**
   * Calculate total price including fees
   */
  protected calculateTotal(delivery: DeliveryOption): number {
    return delivery.price + delivery.deliveryFee + delivery.serviceFee + delivery.tax + (delivery.tip || 0);
  }

  /**
   * Format error message
   */
  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }
}
