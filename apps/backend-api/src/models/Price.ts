import mongoose, { Schema, Document } from 'mongoose';
import { Price, PriceUnit, PriceSource } from '@shared/types';

export interface IPrice extends Omit<Price, 'id'>, Document {}

const priceSchema = new Schema<IPrice>({
  foodItemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'FoodItem', 
    required: true,
    index: true 
  },
  storeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true,
    index: true 
  },
  price: { type: Number, required: true, index: true },
  currency: { type: String, required: true, default: 'USD' },
  unit: { 
    type: String, 
    enum: Object.values(PriceUnit), 
    required: true 
  },
  quantity: { type: Number, required: true, default: 1 },
  isOnSale: { type: Boolean, default: false, index: true },
  salePrice: { type: Number },
  saleEndDate: { type: Date },
  isAvailable: { type: Boolean, default: true, index: true },
  lastUpdated: { type: Date, default: Date.now, index: true },
  source: { 
    type: String, 
    enum: Object.values(PriceSource), 
    required: true 
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for better query performance
priceSchema.index({ foodItemId: 1, storeId: 1 });
priceSchema.index({ foodItemId: 1, isAvailable: 1, price: 1 });
priceSchema.index({ storeId: 1, isAvailable: 1, lastUpdated: -1 });
priceSchema.index({ isOnSale: 1, isAvailable: 1 });
priceSchema.index({ lastUpdated: -1 });

export const PriceModel = mongoose.model<IPrice>('Price', priceSchema);
