import mongoose, { Schema, Document } from 'mongoose';
import { FoodItem, FoodCategory, NutritionInfo } from '@shared/types';

export interface IFoodItem extends Omit<FoodItem, 'id'>, Document {}

const nutritionInfoSchema = new Schema<NutritionInfo>({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number },
  sugar: { type: Number },
  sodium: { type: Number },
  servingSize: { type: String, required: true },
}, { _id: false });

const foodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true, index: true },
  brand: { type: String, index: true },
  category: { 
    type: String, 
    enum: Object.values(FoodCategory), 
    required: true,
    index: true 
  },
  description: { type: String },
  imageUrl: { type: String },
  nutritionInfo: nutritionInfoSchema,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
foodItemSchema.index({ name: 'text', brand: 'text', description: 'text' });
foodItemSchema.index({ category: 1, name: 1 });

export const FoodItemModel = mongoose.model<IFoodItem>('FoodItem', foodItemSchema);
