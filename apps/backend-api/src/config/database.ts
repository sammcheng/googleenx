import mongoose from 'mongoose';
import { config } from '@/config/config.js';

export async function connectDatabase(): Promise<boolean> {
  if (!config.services.persistence.mongodbEnabled) {
    console.log('MongoDB disabled, skipping connection');
    return false;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-price-comparison';

  try {
    await mongoose.connect(mongoUri, config.database.mongodb.options);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (config.services.persistence.mongodbRequired) {
      throw error;
    }
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    throw error;
  }
}
