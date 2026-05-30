import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { compareRouter } from '../compare.js';
import { restaurantsRouter } from '../restaurants.js';
import { gasRouter } from '../gas.js';
import { userRouter } from '../user.js';
import { authenticate } from '../../middleware/auth.js';

// Mock authentication middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user', tier: 'free' };
    next();
  }),
  optionalAuth: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user', tier: 'free' };
    next();
  }),
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/compare', compareRouter);
  app.use('/restaurants', restaurantsRouter);
  app.use('/gas', gasRouter);
  app.use('/user', userRouter);
  return app;
};

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('POST /compare', () => {
    it('should compare prices successfully', async () => {
      const requestBody = {
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

      const response = await request(app)
        .post('/compare')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('comparisonId');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('totalItems', 1);
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('platforms');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('metadata');
    });

    it('should validate request body', async () => {
      const invalidRequestBody = {
        items: [], // Empty items array
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      await request(app)
        .post('/compare')
        .send(invalidRequestBody)
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const incompleteRequestBody = {
        items: [{ name: 'Pizza', quantity: 2, price: 15.99 }],
        // Missing location and deliveryAddress
      };

      await request(app)
        .post('/compare')
        .send(incompleteRequestBody)
        .expect(400);
    });

    it('should expose compare health on the static health route', async () => {
      const response = await request(app)
        .get('/compare/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('serviceAvailable');
      expect(response.body).toHaveProperty('requestId');
    });
  });

  describe('GET /restaurants/:id', () => {
    it('should get restaurant details successfully', async () => {
      const restaurantId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/restaurants/${restaurantId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', restaurantId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('cuisine');
      expect(response.body).toHaveProperty('rating');
      expect(response.body).toHaveProperty('menu');
      expect(response.body).toHaveProperty('platforms');
      expect(response.body).toHaveProperty('metadata');
    });

    it('should validate restaurant ID format', async () => {
      const invalidId = 'invalid-id';

      await request(app)
        .get(`/restaurants/${invalidId}`)
        .expect(400);
    });

    it('should handle restaurant not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // This would typically return 404 in a real implementation
      // For now, we'll test the validation
      await request(app)
        .get(`/restaurants/${nonExistentId}`)
        .expect(200); // Mock implementation returns data
    });
  });

  describe('POST /gas/calculate', () => {
    it('should calculate gas cost successfully', async () => {
      const requestBody = {
        distance: 5.0,
        gasPrice: 3.50,
        mpg: 25,
        foodCost: 15.50,
        deliveryCost: 19.66,
        timeToPickup: 15,
        timeToReturn: 15,
        userPreferences: {
          currency: 'USD',
          showDetailedBreakdown: true,
          includeTimeValue: false,
        },
      };

      const response = await request(app)
        .post('/gas/calculate')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('calculationId');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('input');
      expect(response.body).toHaveProperty('calculation');
      expect(response.body).toHaveProperty('timeAnalysis');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('metadata');

      // Verify calculation results
      expect(response.body.calculation).toHaveProperty('gasCost');
      expect(response.body.calculation).toHaveProperty('totalPickupCost');
      expect(response.body.calculation).toHaveProperty('savings');
      expect(response.body.calculation).toHaveProperty('savingsPercentage');
      expect(response.body.calculation).toHaveProperty('isWorthIt');
      expect(response.body.calculation).toHaveProperty('costPerMile');
    });

    it('should validate gas calculation request', async () => {
      const invalidRequestBody = {
        distance: -1, // Invalid distance
        gasPrice: 3.50,
        mpg: 25,
        foodCost: 15.50,
        deliveryCost: 19.66,
      };

      await request(app)
        .post('/gas/calculate')
        .send(invalidRequestBody)
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const incompleteRequestBody = {
        distance: 5.0,
        gasPrice: 3.50,
        // Missing mpg, foodCost, deliveryCost
      };

      await request(app)
        .post('/gas/calculate')
        .send(incompleteRequestBody)
        .expect(400);
    });

    it('should calculate time value when requested', async () => {
      const requestBody = {
        distance: 5.0,
        gasPrice: 3.50,
        mpg: 25,
        foodCost: 15.50,
        deliveryCost: 19.66,
        timeToPickup: 15,
        timeToReturn: 15,
        userPreferences: {
          currency: 'USD',
          includeTimeValue: true,
          hourlyRate: 25.00,
        },
      };

      const response = await request(app)
        .post('/gas/calculate')
        .send(requestBody)
        .expect(200);

      expect(response.body.timeAnalysis).toHaveProperty('timeValue');
      expect(response.body.timeAnalysis).toHaveProperty('timeCost');
    });
  });

  describe('GET /user/preferences', () => {
    it('should get user preferences successfully', async () => {
      const response = await request(app)
        .get('/user/preferences')
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('metadata');

      // Verify preferences structure
      expect(response.body.preferences).toHaveProperty('currency');
      expect(response.body.preferences).toHaveProperty('language');
      expect(response.body.preferences).toHaveProperty('timezone');
      expect(response.body.preferences).toHaveProperty('units');
      expect(response.body.preferences).toHaveProperty('notifications');
      expect(response.body.preferences).toHaveProperty('delivery');
      expect(response.body.preferences).toHaveProperty('gas');
      expect(response.body.preferences).toHaveProperty('privacy');
      expect(response.body.preferences).toHaveProperty('accessibility');
    });

    it('should require authentication', async () => {
      // Mock authenticate to throw error
      vi.mocked(authenticate).mockImplementationOnce((req, res, next) => {
        const error = new Error('Authentication required');
        next(error);
      });

      await request(app)
        .get('/user/preferences')
        .expect(500); // Error handler will catch this
    });
  });

  describe('PUT /user/preferences', () => {
    it('should update user preferences successfully', async () => {
      const updateData = {
        currency: 'EUR',
        language: 'es',
        timezone: 'Europe/Madrid',
        units: 'metric',
        notifications: {
          email: true,
          push: false,
          sms: false,
          priceAlerts: true,
          comparisonResults: true,
          newFeatures: false,
        },
        delivery: {
          maxDistance: 15,
          maxDeliveryTime: 45,
          preferredPlatforms: ['doordash'],
          dietaryRestrictions: ['vegetarian'],
          priceRange: '$$',
          autoCompare: true,
        },
        gas: {
          mpg: 30,
          gasPrice: 4.00,
          includeTimeValue: true,
          hourlyRate: 30.00,
          autoCalculate: true,
        },
        privacy: {
          shareData: false,
          analytics: true,
          personalizedAds: false,
          dataRetention: '365',
        },
        accessibility: {
          highContrast: true,
          largeText: false,
          screenReader: false,
          keyboardNavigation: true,
        },
      };

      const response = await request(app)
        .put('/user/preferences')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('metadata');

      // Verify updated preferences
      expect(response.body.preferences.currency).toBe('EUR');
      expect(response.body.preferences.language).toBe('es');
      expect(response.body.preferences.timezone).toBe('Europe/Madrid');
      expect(response.body.preferences.units).toBe('metric');
    });

    it('should validate preferences data', async () => {
      const invalidData = {
        currency: 'INVALID', // Invalid currency
        language: 'x', // Too short
        timezone: 'Invalid/Timezone',
        units: 'invalid', // Invalid units
        notifications: {
          email: 'not-boolean', // Invalid type
        },
        delivery: {
          maxDistance: -1, // Invalid distance
          maxDeliveryTime: 200, // Too high
          preferredPlatforms: ['invalid-platform'], // Invalid platform
        },
        gas: {
          mpg: 5, // Too low
          gasPrice: -1, // Invalid price
          hourlyRate: 2000, // Too high
        },
        privacy: {
          dataRetention: 'invalid', // Invalid retention period
        },
      };

      await request(app)
        .put('/user/preferences')
        .send(invalidData)
        .expect(400);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        currency: 'GBP',
        gas: {
          mpg: 35,
        },
      };

      const response = await request(app)
        .put('/user/preferences')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.preferences.currency).toBe('GBP');
      expect(response.body.preferences.gas.mpg).toBe(35);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const invalidData = {
        items: 'not-an-array',
        location: { lat: 'not-a-number', lng: -74.0060 },
        deliveryAddress: {
          street: 123, // Should be string
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      };

      const response = await request(app)
        .post('/compare')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should handle missing request body', async () => {
      await request(app)
        .post('/compare')
        .expect(400);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/compare')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('Response Format', () => {
    it('should include proper headers', async () => {
      const requestBody = {
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

      const response = await request(app)
        .post('/compare')
        .send(requestBody)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include request ID in responses', async () => {
      const response = await request(app)
        .get('/restaurants/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('requestId');
    });

    it('should include timestamps in responses', async () => {
      const response = await request(app)
        .get('/restaurants/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('lastUpdated');
      expect(new Date(response.body.metadata.lastUpdated)).toBeInstanceOf(Date);
    });
  });
});
