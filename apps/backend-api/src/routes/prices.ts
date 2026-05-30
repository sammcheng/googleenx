import express from 'express';
import { PriceModel } from '../models/Price.js';
import { FoodItemModel } from '../models/FoodItem.js';
import { StoreModel } from '../models/Store.js';
import { ApiResponse, PriceComparison, PriceWithStore } from '@shared/types';

const router = express.Router();

// GET /api/prices/food/:foodItemId - Get prices for a specific food item
router.get('/food/:foodItemId', async (req, res, next) => {
  try {
    const { foodItemId } = req.params;
    const { storeIds } = req.query;

    const query: any = { 
      foodItemId, 
      isAvailable: true 
    };

    if (storeIds) {
      const storeIdArray = (storeIds as string).split(',');
      query.storeId = { $in: storeIdArray };
    }

    const prices = await PriceModel.find(query)
      .populate('storeId', 'name chain logoUrl')
      .sort({ price: 1 })
      .lean();

    if (prices.length === 0) {
      return res.json({
        success: true,
        data: {
          foodItemId,
          prices: [],
          bestPrice: null,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          lastUpdated: new Date(),
        },
      });
    }

    const pricesWithStore: PriceWithStore[] = prices.map(price => ({
      ...price,
      store: price.storeId as any,
    }));

    const priceValues = prices.map(p => p.price);
    const bestPrice = pricesWithStore[0]; // Already sorted by price
    const averagePrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const priceRange = {
      min: Math.min(...priceValues),
      max: Math.max(...priceValues),
    };

    const comparison: PriceComparison = {
      foodItemId,
      prices: pricesWithStore,
      bestPrice,
      averagePrice,
      priceRange,
      lastUpdated: new Date(),
    };

    const response: ApiResponse<PriceComparison> = {
      success: true,
      data: comparison,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/prices/comparison - Compare prices across multiple food items
router.get('/comparison', async (req, res, next) => {
  try {
    const { foodItemIds } = req.query;
    
    if (!foodItemIds) {
      return res.status(400).json({
        success: false,
        error: 'foodItemIds parameter is required',
      });
    }

    const foodItemIdArray = (foodItemIds as string).split(',');
    const comparisons: PriceComparison[] = [];

    for (const foodItemId of foodItemIdArray) {
      const prices = await PriceModel.find({ 
        foodItemId, 
        isAvailable: true 
      })
        .populate('storeId', 'name chain logoUrl')
        .sort({ price: 1 })
        .lean();

      if (prices.length > 0) {
        const pricesWithStore: PriceWithStore[] = prices.map(price => ({
          ...price,
          store: price.storeId as any,
        }));

        const priceValues = prices.map(p => p.price);
        const bestPrice = pricesWithStore[0];
        const averagePrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
        const priceRange = {
          min: Math.min(...priceValues),
          max: Math.max(...priceValues),
        };

        comparisons.push({
          foodItemId,
          prices: pricesWithStore,
          bestPrice,
          averagePrice,
          priceRange,
          lastUpdated: new Date(),
        });
      }
    }

    const response: ApiResponse<PriceComparison[]> = {
      success: true,
      data: comparisons,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/prices - Create or update price
router.post('/', async (req, res, next) => {
  try {
    const { foodItemId, storeId, price, currency, unit, quantity, isOnSale, salePrice, source } = req.body;

    // Check if price already exists
    const existingPrice = await PriceModel.findOne({
      foodItemId,
      storeId,
    });

    if (existingPrice) {
      // Update existing price
      existingPrice.price = price;
      existingPrice.currency = currency || 'USD';
      existingPrice.unit = unit;
      existingPrice.quantity = quantity || 1;
      existingPrice.isOnSale = isOnSale || false;
      existingPrice.salePrice = salePrice;
      existingPrice.isAvailable = true;
      existingPrice.lastUpdated = new Date();
      existingPrice.source = source || 'manual';

      await existingPrice.save();

      const response: ApiResponse<any> = {
        success: true,
        data: existingPrice.toObject(),
        message: 'Price updated successfully',
      };

      return res.json(response);
    }

    // Create new price
    const newPrice = new PriceModel({
      foodItemId,
      storeId,
      price,
      currency: currency || 'USD',
      unit,
      quantity: quantity || 1,
      isOnSale: isOnSale || false,
      salePrice,
      isAvailable: true,
      lastUpdated: new Date(),
      source: source || 'manual',
    });

    await newPrice.save();

    const response: ApiResponse<any> = {
      success: true,
      data: newPrice.toObject(),
      message: 'Price created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
