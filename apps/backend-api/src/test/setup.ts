import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';

beforeAll(async () => {
  if (process.env.SKIP_TEST_DB === '1') {
    return;
  }

  // Connect to test database
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/food-price-comparison-test';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 1000,
    });
  } catch {
    // Many route/service tests do not require Mongo. Let them continue.
  }
});

afterAll(async () => {
  if (process.env.SKIP_TEST_DB === '1') {
    return;
  }

  if (mongoose.connection.readyState === 1) {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
  }
});
