import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComparisonOrchestrator, ComparisonRequest } from '../ComparisonOrchestrator.js';
import { GasCalculator } from '../GasCalculator.js';
import { DoorDashScraper } from '../scrapers/DoorDashScraper.js';
import { UberEatsScraper } from '../scrapers/UberEatsScraper.js';
import { GrubhubScraper } from '../scrapers/GrubhubScraper.js';

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ComparisonOrchestrator', () => {
  let orchestrator: ComparisonOrchestrator;
  let gasCalculator: GasCalculator;
  let doorDashScraper: DoorDashScraper;
  let uberEatsScraper: UberEatsScraper;
  let grubhubScraper: GrubhubScraper;

  beforeEach(() => {
    gasCalculator = new GasCalculator();
    orchestrator = new ComparisonOrchestrator(gasCalculator);
    
    doorDashScraper = new DoorDashScraper({});
    uberEatsScraper = new UberEatsScraper({});
    grubhubScraper = new GrubhubScraper({});
    
    orchestrator.registerScraper(doorDashScraper);
    orchestrator.registerScraper(uberEatsScraper);
    orchestrator.registerScraper(grubhubScraper);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('comparePrices', () => {
    it('should compare prices across all platforms', async () => {
      const request: ComparisonRequest = {
        items: [
          { name: 'Pizza', quantity: 2, price: 15.99, category: 'Pizza' },
        ],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        preferredPlatforms: ['doordash', 'ubereats', 'grubhub'],
        includePickup: true,
        includeGasCalculation: true,
        userPreferences: {
          mpg: 25,
          gasPrice: 3.50,
          includeTimeValue: false,
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result).toHaveProperty('comparisonId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('totalItems', 1);
      expect(result).toHaveProperty('totalValue', 31.98);
      expect(result).toHaveProperty('platforms');
      expect(result).toHaveProperty('bestDeal');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metadata');

      expect(result.platforms).toHaveLength(3);
      expect(result.platforms.every(p => p.platform)).toBe(true);
    });

    it('should handle scraper failures gracefully', async () => {
      // Mock scraper to fail
      const failingScraper = new DoorDashScraper({});
      vi.spyOn(failingScraper, 'scrape').mockRejectedValue(new Error('Scraper failed'));
      
      orchestrator.unregisterScraper('doordash');
      orchestrator.registerScraper(failingScraper);

      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.platforms).toHaveLength(3);
      expect(result.platforms.some(p => p.platform === 'doordash' && !p.available)).toBe(true);
    });

    it('should include gas calculation when requested', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        includePickup: true,
        includeGasCalculation: true,
        userPreferences: {
          mpg: 30,
          gasPrice: 4.00,
          includeTimeValue: true,
          hourlyRate: 25.00,
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.platforms.some(p => p.gasCalculation)).toBe(true);
      expect(result.platforms.some(p => p.gasCalculation?.isWorthIt !== undefined)).toBe(true);
    });

    it('should handle timeout scenarios', async () => {
      // Mock scraper to timeout
      const slowScraper = new DoorDashScraper({ timeout: 100 });
      vi.spyOn(slowScraper, 'scrape').mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: {
            platform: 'doordash',
            available: true,
            restaurant: { id: 'test', name: 'Test Restaurant' },
            delivery: { available: true, price: 15.99, deliveryFee: 3.99, serviceFee: 2.50, tax: 1.50, total: 23.98, estimatedTime: 35 },
            pickup: { available: true, price: 15.99, estimatedTime: 20 },
          },
          metadata: { platform: 'doordash', startTime: Date.now(), endTime: Date.now(), duration: 0, retryCount: 0, cacheHit: false, dataQuality: 'high', errorCount: 0 },
        }), 200))
      );
      
      orchestrator.unregisterScraper('doordash');
      orchestrator.registerScraper(slowScraper);

      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.platforms).toHaveLength(3);
      expect(result.platforms.some(p => p.platform === 'doordash' && !p.available)).toBe(true);
    });

    it('should filter platforms based on preferences', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        preferredPlatforms: ['doordash', 'ubereats'], // Only these two
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.platforms).toHaveLength(2);
      expect(result.platforms.every(p => ['doordash', 'ubereats'].includes(p.platform))).toBe(true);
    });
  });

  describe('scraper management', () => {
    it('should register and unregister scrapers', () => {
      expect(orchestrator.getRegisteredScrapers()).toHaveLength(3);
      expect(orchestrator.getRegisteredScrapers()).toContain('doordash');
      expect(orchestrator.getRegisteredScrapers()).toContain('ubereats');
      expect(orchestrator.getRegisteredScrapers()).toContain('grubhub');

      orchestrator.unregisterScraper('doordash');
      expect(orchestrator.getRegisteredScrapers()).toHaveLength(2);
      expect(orchestrator.getRegisteredScrapers()).not.toContain('doordash');
    });

    it('should handle unknown scraper unregistration', () => {
      const initialCount = orchestrator.getRegisteredScrapers().length;
      orchestrator.unregisterScraper('unknown');
      expect(orchestrator.getRegisteredScrapers()).toHaveLength(initialCount);
    });
  });

  describe('health check', () => {
    it('should perform health check on all scrapers', async () => {
      const health = await orchestrator.healthCheck();
      expect(typeof health).toBe('boolean');
    });

    it('should handle health check failures', async () => {
      // Mock one scraper to fail health check
      vi.spyOn(doorDashScraper, 'healthCheck').mockResolvedValue(false);
      
      const health = await orchestrator.healthCheck();
      expect(typeof health).toBe('boolean');
    });
  });

  describe('best deal analysis', () => {
    it('should identify best delivery option', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.bestDeal).toHaveProperty('bestDelivery');
      expect(result.bestDeal).toHaveProperty('bestPickup');
      expect(result.bestDeal).toHaveProperty('bestOverall');
      expect(result.bestDeal).toHaveProperty('savings');
      expect(result.bestDeal).toHaveProperty('confidence');
    });

    it('should generate recommendations', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.every(r => 
        r.platform && r.reason && r.savings !== undefined && r.confidence > 0
      )).toBe(true);
    });
  });

  describe('data normalization', () => {
    it('should normalize platform data consistently', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      result.platforms.forEach(platform => {
        expect(platform).toHaveProperty('platform');
        expect(platform).toHaveProperty('available');
        expect(platform).toHaveProperty('restaurant');
        expect(platform).toHaveProperty('metadata');
        
        if (platform.available) {
          expect(platform.restaurant).toHaveProperty('id');
          expect(platform.restaurant).toHaveProperty('name');
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle orchestrator errors gracefully', async () => {
      // Mock gas calculator to fail
      const failingGasCalculator = new GasCalculator();
      vi.spyOn(failingGasCalculator, 'calculateGasCost').mockRejectedValue(new Error('Gas calculation failed'));
      
      const failingOrchestrator = new ComparisonOrchestrator(failingGasCalculator);
      failingOrchestrator.registerScraper(doorDashScraper);

      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        includeGasCalculation: true,
        userPreferences: { mpg: 25, gasPrice: 3.50 },
      };

      await expect(failingOrchestrator.comparePrices(request)).rejects.toThrow();
    });

    it('should handle empty scraper list', async () => {
      const emptyOrchestrator = new ComparisonOrchestrator(gasCalculator);
      
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      await expect(emptyOrchestrator.comparePrices(request)).rejects.toThrow('No scrapers available for comparison');
    });
  });

  describe('performance metrics', () => {
    it('should track response time', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.metadata).toHaveProperty('responseTime');
      expect(result.metadata.responseTime).toBeGreaterThan(0);
    });

    it('should track data quality', async () => {
      const request: ComparisonRequest = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const result = await orchestrator.comparePrices(request);

      expect(result.metadata).toHaveProperty('dataQuality');
      expect(['high', 'medium', 'low']).toContain(result.metadata.dataQuality);
    });
  });
});
