import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compareRouter } from '../compare.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((_req, _res, next) => next()),
  optionalAuth: vi.fn((_req, _res, next) => next()),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/compare', compareRouter);
  return app;
};

describe('compareRouter', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  it('accepts comparison requests at the mounted root path', async () => {
    const response = await request(app)
      .post('/compare')
      .send({
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.006 },
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
          mpg: 25,
          gasPrice: 3.5,
        },
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        comparisonId: expect.any(String),
        totalItems: 1,
        platforms: expect.any(Array),
        recommendations: expect.any(Array),
      }),
    );
  });

  it('keeps the static health route ahead of the dynamic id route', async () => {
    const response = await request(app)
      .get('/compare/health')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: expect.stringMatching(/healthy|unhealthy/),
        serviceAvailable: expect.any(Boolean),
        cacheSize: expect.any(Number),
      }),
    );
  });
});
