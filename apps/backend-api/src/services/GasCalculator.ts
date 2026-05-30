import { logger } from '@/utils/logger.js';

/**
 * Location interface
 */
export interface Location {
  lat: number;
  lng: number;
  address?: string;
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
 * Pickup option interface
 */
export interface PickupOption {
  available: boolean;
  price: number;
  estimatedTime: number;
  minimumOrder?: number;
  pickupLocation?: string;
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
 * Gas calculation result interface
 */
export interface GasCalculationResult {
  distance: number; // Round trip distance in miles
  gasCost: number; // Total gas cost
  totalPickupCost: number; // Food cost + gas cost
  savings: number; // Savings vs delivery
  isWorthIt: boolean; // Whether pickup is worth it
  timeValue?: number; // Time value if included
  totalValue: number; // Total value including time
  breakdown: GasBreakdown;
  recommendations: GasRecommendation[];
}

/**
 * Gas cost breakdown interface
 */
export interface GasBreakdown {
  distance: number;
  mpg: number;
  gasPrice: number;
  gasCost: number;
  foodCost: number;
  totalCost: number;
  deliveryCost: number;
  savings: number;
  timeCost?: number;
  totalValue?: number;
}

/**
 * Gas recommendation interface
 */
export interface GasRecommendation {
  type: 'pickup' | 'delivery' | 'mixed';
  reason: string;
  savings: number;
  confidence: number;
  conditions: string[];
}

/**
 * Gas calculator service interface
 */
export interface IGasCalculator {
  calculateGasCost(
    pickup: PickupOption,
    userLocation: Location,
    userPreferences: UserPreferences,
    deliveryCost?: number
  ): Promise<GasCalculationResult>;
  
  calculateDistance(
    start: Location,
    end: Location
  ): Promise<number>;
  
  getGasPrice(location: Location): Promise<number>;
  
  validatePreferences(preferences: UserPreferences): boolean;
}

/**
 * Gas calculator service implementation
 */
export class GasCalculator implements IGasCalculator {
  private readonly logger = logger;
  private readonly defaultMpg = 25;
  private readonly defaultGasPrice = 3.50;
  private readonly defaultHourlyRate = 25.00;
  private readonly timeValueMultiplier = 0.5; // 50% of hourly rate for time value

  /**
   * Calculate gas cost for pickup
   */
  async calculateGasCost(
    pickup: PickupOption,
    userLocation: Location,
    userPreferences: UserPreferences,
    deliveryCost?: number
  ): Promise<GasCalculationResult> {
    try {
      this.logger.info('Calculating gas cost for pickup', {
        pickupPrice: pickup.price,
        userLocation,
        mpg: userPreferences.mpg,
        gasPrice: userPreferences.gasPrice,
      });

      // Validate preferences
      if (!this.validatePreferences(userPreferences)) {
        throw new Error('Invalid user preferences for gas calculation');
      }

      // Get distance to restaurant
      const distance = await this.calculateDistance(userLocation, {
        lat: userLocation.lat, // Mock restaurant location
        lng: userLocation.lng,
      });

      // Get gas price
      const gasPrice = await this.getGasPrice(userLocation);

      // Calculate gas cost
      const mpg = userPreferences.mpg || this.defaultMpg;
      const roundTripDistance = distance * 2;
      const gasCost = (roundTripDistance * gasPrice) / mpg;

      // Calculate total pickup cost
      const totalPickupCost = pickup.price + gasCost;

      // Calculate delivery cost (if not provided, estimate)
      const estimatedDeliveryCost = deliveryCost || pickup.price + 5.00; // Add estimated delivery fees
      const savings = estimatedDeliveryCost - totalPickupCost;

      // Calculate time value if requested
      let timeValue = 0;
      let totalValue = totalPickupCost;
      
      if (userPreferences.includeTimeValue && userPreferences.hourlyRate) {
        const pickupTime = pickup.estimatedTime / 60; // Convert to hours
        timeValue = pickupTime * userPreferences.hourlyRate * this.timeValueMultiplier;
        totalValue = totalPickupCost + timeValue;
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        savings,
        gasCost,
        timeValue,
        userPreferences
      );

      const result: GasCalculationResult = {
        distance: roundTripDistance,
        gasCost: Math.round(gasCost * 100) / 100,
        totalPickupCost: Math.round(totalPickupCost * 100) / 100,
        savings: Math.round(savings * 100) / 100,
        isWorthIt: savings > 0,
        timeValue: timeValue > 0 ? Math.round(timeValue * 100) / 100 : undefined,
        totalValue: Math.round(totalValue * 100) / 100,
        breakdown: {
          distance: roundTripDistance,
          mpg,
          gasPrice,
          gasCost: Math.round(gasCost * 100) / 100,
          foodCost: pickup.price,
          totalCost: Math.round(totalPickupCost * 100) / 100,
          deliveryCost: estimatedDeliveryCost,
          savings: Math.round(savings * 100) / 100,
          timeCost: timeValue > 0 ? Math.round(timeValue * 100) / 100 : undefined,
          totalValue: timeValue > 0 ? Math.round(totalValue * 100) / 100 : undefined,
        },
        recommendations,
      };

      this.logger.info('Gas cost calculation completed', {
        distance: roundTripDistance,
        gasCost: result.gasCost,
        totalPickupCost: result.totalPickupCost,
        savings: result.savings,
        isWorthIt: result.isWorthIt,
      });

      return result;
    } catch (error) {
      this.logger.error('Gas cost calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pickup: pickup.price,
        userLocation,
      });
      throw error;
    }
  }

  /**
   * Calculate distance between two locations
   */
  async calculateDistance(start: Location, end: Location): Promise<number> {
    try {
      // Use Haversine formula for distance calculation
      const R = 3959; // Earth's radius in miles
      const dLat = this.toRadians(end.lat - start.lat);
      const dLng = this.toRadians(end.lng - start.lng);
      
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(start.lat)) * Math.cos(this.toRadians(end.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      this.logger.debug('Distance calculated', {
        start,
        end,
        distance,
      });

      return Math.round(distance * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      this.logger.error('Distance calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        start,
        end,
      });
      throw error;
    }
  }

  /**
   * Get gas price for location
   */
  async getGasPrice(location: Location): Promise<number> {
    try {
      // TODO: Integrate with real gas price API
      // For now, return a mock price based on location
      const basePrice = this.defaultGasPrice;
      
      // Add some location-based variation
      const variation = (location.lat + location.lng) % 1;
      const gasPrice = basePrice + (variation - 0.5) * 0.5;

      this.logger.debug('Gas price retrieved', {
        location,
        gasPrice,
      });

      return Math.round(gasPrice * 100) / 100;
    } catch (error) {
      this.logger.error('Gas price retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        location,
      });
      return this.defaultGasPrice;
    }
  }

  /**
   * Validate user preferences
   */
  validatePreferences(preferences: UserPreferences): boolean {
    if (preferences.mpg && (preferences.mpg < 10 || preferences.mpg > 50)) {
      return false;
    }
    if (preferences.gasPrice && (preferences.gasPrice < 0.5 || preferences.gasPrice > 10.0)) {
      return false;
    }
    if (preferences.hourlyRate && (preferences.hourlyRate < 0 || preferences.hourlyRate > 1000)) {
      return false;
    }
    return true;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate gas recommendations
   */
  private generateRecommendations(
    savings: number,
    gasCost: number,
    timeValue: number,
    preferences: UserPreferences
  ): GasRecommendation[] {
    const recommendations: GasRecommendation[] = [];

    if (savings > 5) {
      recommendations.push({
        type: 'pickup',
        reason: 'Significant savings with pickup',
        savings: Math.round(savings * 100) / 100,
        confidence: 0.9,
        conditions: ['Good savings', 'Reasonable distance'],
      });
    } else if (savings > 0) {
      recommendations.push({
        type: 'pickup',
        reason: 'Modest savings with pickup',
        savings: Math.round(savings * 100) / 100,
        confidence: 0.7,
        conditions: ['Small savings', 'Consider time value'],
      });
    } else if (gasCost < 2) {
      recommendations.push({
        type: 'pickup',
        reason: 'Low gas cost makes pickup viable',
        savings: Math.round(savings * 100) / 100,
        confidence: 0.6,
        conditions: ['Low gas cost', 'Close distance'],
      });
    } else {
      recommendations.push({
        type: 'delivery',
        reason: 'Delivery may be more cost-effective',
        savings: Math.round(Math.abs(savings) * 100) / 100,
        confidence: 0.8,
        conditions: ['High gas cost', 'Long distance'],
      });
    }

    if (timeValue > 0 && preferences.includeTimeValue) {
      recommendations.push({
        type: 'mixed',
        reason: 'Consider time value in decision',
        savings: Math.round(savings * 100) / 100,
        confidence: 0.5,
        conditions: ['Time value included', 'Hourly rate considered'],
      });
    }

    return recommendations;
  }

  /**
   * Calculate fuel efficiency based on vehicle type
   */
  calculateFuelEfficiency(vehicleType: string): number {
    const efficiencyMap: Record<string, number> = {
      'sedan': 25,
      'suv': 20,
      'truck': 18,
      'hybrid': 35,
      'electric': 100, // MPGe
      'motorcycle': 50,
      'compact': 30,
      'luxury': 22,
    };

    return efficiencyMap[vehicleType.toLowerCase()] || this.defaultMpg;
  }

  /**
   * Estimate gas price based on location and time
   */
  estimateGasPrice(location: Location, timeOfDay?: string): number {
    const basePrice = this.defaultGasPrice;
    
    // Add location-based variation
    const locationVariation = (location.lat + location.lng) % 1;
    let price = basePrice + (locationVariation - 0.5) * 0.5;

    // Add time-based variation
    if (timeOfDay) {
      const hour = new Date().getHours();
      if (hour >= 7 && hour <= 9) { // Morning rush
        price += 0.10;
      } else if (hour >= 17 && hour <= 19) { // Evening rush
        price += 0.15;
      }
    }

    return Math.round(price * 100) / 100;
  }

  /**
   * Calculate carbon footprint
   */
  calculateCarbonFootprint(distance: number, mpg: number): number {
    // CO2 emissions in pounds per mile
    const co2PerMile = 19.6 / mpg;
    return Math.round(distance * co2PerMile * 100) / 100;
  }

  /**
   * Get optimal pickup time
   */
  getOptimalPickupTime(restaurantHours: string, currentTime: Date): string {
    // TODO: Implement logic to find optimal pickup time
    // This would consider restaurant hours, current time, and estimated prep time
    return '30-45 minutes';
  }
}
