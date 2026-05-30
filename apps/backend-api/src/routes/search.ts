import express from 'express';
import { FoodItemModel } from '../models/FoodItem.js';
import { PriceModel } from '../models/Price.js';
import { StoreModel } from '../models/Store.js';
import { ApiResponse, SearchFilters, SortOption } from '@shared/types';

const router = express.Router();

// GET /api/search - Search food items with filters
router.get('/', async (req, res, next) => {
  try {
    const {
      query,
      category,
      storeIds,
      minPrice,
      maxPrice,
      isOnSale,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '20',
    } = req.query;

    const filters: SearchFilters = {
      query: query as string,
      category: category as any,
      storeIds: storeIds ? (storeIds as string).split(',') : undefined,
      priceRange: minPrice && maxPrice ? {
        min: parseFloat(minPrice as string),
        max: parseFloat(maxPrice as string),
      } : undefined,
      isOnSale: isOnSale === 'true',
      sortBy: sortBy as SortOption,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build food item query
    const foodQuery: any = {};
    
    if (filters.query) {
      foodQuery.$text = { $search: filters.query };
    }
    
    if (filters.category) {
      foodQuery.category = filters.category;
    }

    // Build price query
    const priceQuery: any = { isAvailable: true };
    
    if (filters.storeIds) {
      priceQuery.storeId = { $in: filters.storeIds };
    }
    
    if (filters.priceRange) {
      priceQuery.price = {
        $gte: filters.priceRange.min,
        $lte: filters.priceRange.max,
      };
    }
    
    if (filters.isOnSale) {
      priceQuery.isOnSale = true;
    }

    // Get food items with prices
    const foodItems = await FoodItemModel.find(foodQuery)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get prices for these food items
    const foodItemIds = foodItems.map(item => item._id);
    const prices = await PriceModel.find({
      foodItemId: { $in: foodItemIds },
      ...priceQuery,
    })
      .populate('storeId', 'name chain logoUrl')
      .lean();

    // Group prices by food item
    const pricesByFoodItem = prices.reduce((acc, price) => {
      const foodItemId = price.foodItemId.toString();
      if (!acc[foodItemId]) {
        acc[foodItemId] = [];
      }
      acc[foodItemId].push(price);
      return acc;
    }, {} as Record<string, any[]>);

    // Combine food items with their prices
    const results = foodItems.map(foodItem => {
      const foodItemPrices = pricesByFoodItem[foodItem._id.toString()] || [];
      
      // Sort prices
      foodItemPrices.sort((a, b) => {
        if (filters.sortBy === 'price') {
          return filters.sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        }
        if (filters.sortBy === 'store') {
          return filters.sortOrder === 'asc' 
            ? a.storeId.name.localeCompare(b.storeId.name)
            : b.storeId.name.localeCompare(a.storeId.name);
        }
        return 0;
      });

      return {
        ...foodItem,
        prices: foodItemPrices,
        bestPrice: foodItemPrices[0] || null,
        averagePrice: foodItemPrices.length > 0 
          ? foodItemPrices.reduce((sum, p) => sum + p.price, 0) / foodItemPrices.length 
          : 0,
        priceCount: foodItemPrices.length,
      };
    });

    // Sort results if needed
    if (filters.sortBy === 'name') {
      results.sort((a, b) => {
        return filters.sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }

    const total = await FoodItemModel.countDocuments(foodQuery);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        filters,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const suggestions = await FoodItemModel.find({
      $text: { $search: q as string },
    })
      .select('name brand category')
      .limit(10)
      .lean();

    const response: ApiResponse<any[]> = {
      success: true,
      data: suggestions,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
