import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ComparisonController, ComparisonControllerContainer } from '../ComparisonController.js';
import { ComparisonService, IComparisonService, ComparisonRequest, ComparisonResult } from '@/services/ComparisonService.js';

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock comparison service
class MockComparisonService implements IComparisonService {
  async comparePrices(request: ComparisonRequest): Promise<ComparisonResult> {
    return {
      comparisonId: 'comp_1234567890_abcdef123',
      timestamp: new Date().toISOString(),
      totalItems: request.items.length,
      totalValue: request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      platforms: [
        {
          platform: 'doordash',
          available: true,
          delivery: {
            available: true,
            price: 15.99,
            deliveryFee: 3.99,
            serviceFee: 2.50,
            tax: 1.50,
            total: 23.98,
            estimatedTime: 35,
            restaurant: {
              id: 'rest_1',
              name: 'Test Restaurant',
              rating: 4.5,
              distance: 1.2,
              cuisine: 'Italian',
            },
          },
          pickup: {
            available: true,
            price: 15.99,
            estimatedTime: 20,
            restaurant: {
              id: 'rest_1',
              name: 'Test Restaurant',
              rating: 4.5,
              distance: 1.2,
              cuisine: 'Italian',
            },
          },
        },
      ],
      recommendations: [
        {
          platform: 'doordash',
          reason: 'Best value',
          savings: 2.00,
          confidence: 0.9,
        },
      ],
      metadata: {
        searchRadius: 10,
        searchTime: 100,
        cacheHit: false,
        requestId: 'req_123',
      },
    };
  }

  async getCachedComparison(cacheKey: string): Promise<ComparisonResult | null> {
    return null; // Mock no cache hit
  }

  async cacheComparison(cacheKey: string, result: ComparisonResult, ttl?: number): Promise<void> {
    // Mock cache implementation
  }

  async clearCache(cacheKey?: string): Promise<void> {
    // Mock cache clear
  }
}

describe('ComparisonController', () => {
  let controller: ComparisonController;
  let mockService: IComparisonService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = new MockComparisonService();
    controller = new ComparisonController(mockService);
    
    mockRequest = {
      id: 'req_123',
      user: { id: 'user_123', email: 'test@example.com', role: 'user', tier: 'free' },
      body: {},
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('comparePrices', () => {
    it('should compare prices successfully', async () => {
      mockRequest.body = {
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
        includePickup: true,
        includeGasCalculation: true,
      };

      await controller.comparePrices(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          comparisonId: expect.any(String),
          timestamp: expect.any(String),
          totalItems: 1,
          totalValue: 31.98,
          platforms: expect.any(Array),
          recommendations: expect.any(Array),
          metadata: expect.objectContaining({
            requestId: 'req_123',
            userId: 'user_123',
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        items: [], // Invalid: empty items array
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      await controller.comparePrices(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.any(Array),
          requestId: 'req_123',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        // Missing location and deliveryAddress
      };

      await controller.comparePrices(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.any(Array),
        })
      );
    });

    it('should handle service errors', async () => {
      const errorService = new MockComparisonService();
      vi.spyOn(errorService, 'comparePrices').mockRejectedValueOnce(new Error('Service error'));
      
      const errorController = new ComparisonController(errorService);
      
      mockRequest.body = {
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

      await errorController.comparePrices(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should include user preferences in request', async () => {
      mockRequest.body = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        userPreferences: {
          maxDeliveryDistance: 15,
          mpg: 30,
          gasPrice: 4.00,
          includeTimeValue: true,
          hourlyRate: 25.00,
        },
      };

      await controller.comparePrices(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user_123',
          }),
        })
      );
    });
  });

  describe('getComparisonById', () => {
    it('should get comparison by valid ID', async () => {
      mockRequest.params = { id: 'comp_1234567890_abcdef123' };
      
      // Mock cache hit
      vi.spyOn(mockService, 'getCachedComparison').mockResolvedValueOnce({
        comparisonId: 'comp_1234567890_abcdef123',
        timestamp: new Date().toISOString(),
        totalItems: 1,
        totalValue: 15.99,
        platforms: [],
        recommendations: [],
        metadata: {
          searchRadius: 10,
          searchTime: 100,
          cacheHit: true,
          requestId: 'req_123',
        },
      });

      await controller.getComparisonById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          comparisonId: 'comp_1234567890_abcdef123',
          metadata: expect.objectContaining({
            requestId: 'req_123',
            userId: 'user_123',
          }),
        })
      );
    });

    it('should handle invalid comparison ID format', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await controller.getComparisonById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle comparison not found', async () => {
      mockRequest.params = { id: 'comp_1234567890_abcdef123' };
      
      // Mock cache miss
      vi.spyOn(mockService, 'getCachedComparison').mockResolvedValueOnce(null);

      await controller.getComparisonById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      mockRequest.query = {};

      await controller.clearCache(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cache cleared successfully',
          cacheKey: 'all',
          requestId: 'req_123',
        })
      );
    });

    it('should clear specific cache key', async () => {
      mockRequest.query = { cacheKey: 'specific-key' };

      await controller.clearCache(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cache cleared successfully',
          cacheKey: 'specific-key',
          requestId: 'req_123',
        })
      );
    });

    it('should handle cache clear errors', async () => {
      const errorService = new MockComparisonService();
      vi.spyOn(errorService, 'clearCache').mockRejectedValueOnce(new Error('Cache error'));
      
      const errorController = new ComparisonController(errorService);
      mockRequest.query = {};

      await errorController.clearCache(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', () => {
      const metrics = controller.getPerformanceMetrics();

      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('averageProcessingTime');
      expect(typeof metrics.cacheSize).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(typeof metrics.averageProcessingTime).toBe('number');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await controller.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('cacheSize');
      expect(health).toHaveProperty('serviceAvailable');
      expect(['healthy', 'unhealthy']).toContain(health.status);
      expect(typeof health.cacheSize).toBe('number');
      expect(typeof health.serviceAvailable).toBe('boolean');
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent cache keys', () => {
      const data1 = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        preferredPlatforms: ['doordash'],
        includePickup: true,
        includeGasCalculation: true,
      };

      const data2 = {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        preferredPlatforms: ['doordash'],
        includePickup: true,
        includeGasCalculation: true,
      };

      // Access private method through any type
      const key1 = (controller as any).generateCacheKey(data1, 'user_123');
      const key2 = (controller as any).generateCacheKey(data2, 'user_123');

      expect(key1).toBe(key2);
      expect(key1).toContain('comparison_user_123_');
    });

    it('should generate different keys for different data', () => {
      const data1 = {
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

      const data2 = {
        items: [{ name: 'Burger', quantity: 1, price: 12.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const key1 = (controller as any).generateCacheKey(data1, 'user_123');
      const key2 = (controller as any).generateCacheKey(data2, 'user_123');

      expect(key1).not.toBe(key2);
    });
  });

  describe('validation', () => {
    it('should validate comparison ID format', () => {
      const isValid1 = (controller as any).isValidComparisonId('comp_1234567890_abcdef123');
      const isValid2 = (controller as any).isValidComparisonId('invalid-id');
      const isValid3 = (controller as any).isValidComparisonId('comp_invalid');

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
      expect(isValid3).toBe(false);
    });
  });
});

describe('ComparisonControllerContainer', () => {
  let container: ComparisonControllerContainer;
  let mockService: IComparisonService;

  beforeEach(() => {
    container = ComparisonControllerContainer.getInstance();
    mockService = new MockComparisonService();
  });

  afterEach(() => {
    container.reset();
  });

  it('should register comparison service', () => {
    container.registerComparisonService(mockService);
    
    const controller = container.getComparisonController();
    expect(controller).toBeInstanceOf(ComparisonController);
  });

  it('should throw error if service not registered', () => {
    expect(() => container.getComparisonController()).toThrow('Comparison service not registered');
  });

  it('should reset container', () => {
    container.registerComparisonService(mockService);
    container.getComparisonController();
    
    container.reset();
    
    expect(() => container.getComparisonController()).toThrow('Comparison service not registered');
  });

  it('should return same instance', () => {
    const container1 = ComparisonControllerContainer.getInstance();
    const container2 = ComparisonControllerContainer.getInstance();
    
    expect(container1).toBe(container2);
  });
});
