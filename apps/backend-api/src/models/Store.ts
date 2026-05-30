import mongoose, { Schema, Document } from 'mongoose';
import { Store, StoreLocation } from '@shared/types';

export interface IStore extends Omit<Store, 'id'>, Document {}

const storeLocationSchema = new Schema<StoreLocation>({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'US' },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
}, { _id: false });

const storeSchema = new Schema<IStore>({
  name: { type: String, required: true, index: true },
  chain: { type: String, index: true },
  location: { type: storeLocationSchema, required: true },
  website: { type: String },
  logoUrl: { type: String },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
storeSchema.index({ name: 'text', chain: 'text' });
storeSchema.index({ 'location.city': 1, 'location.state': 1 });
storeSchema.index({ isActive: 1, name: 1 });

export const StoreModel = mongoose.model<IStore>('Store', storeSchema);
