import express from 'express';
import { FoodItemModel } from '../models/FoodItem.js';
import { ApiResponse, FoodItem, PaginatedResponse } from '@shared/types';

const router = express.Router();

// GET /api/food - Get all food items with pagination
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const [foodItems, total] = await Promise.all([
      FoodItemModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      FoodItemModel.countDocuments(query),
    ]);

    const response: PaginatedResponse<FoodItem> = {
      data: foodItems as FoodItem[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/food/:id - Get food item by ID
router.get('/:id', async (req, res, next) => {
  try {
    const foodItem = await FoodItemModel.findById(req.params.id).lean();
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        error: 'Food item not found',
      });
    }

    const response: ApiResponse<FoodItem> = {
      success: true,
      data: foodItem as FoodItem,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/food - Create new food item
router.post('/', async (req, res, next) => {
  try {
    const foodItem = new FoodItemModel(req.body);
    await foodItem.save();

    const response: ApiResponse<FoodItem> = {
      success: true,
      data: foodItem.toObject() as FoodItem,
      message: 'Food item created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/food/:id - Update food item
router.put('/:id', async (req, res, next) => {
  try {
    const foodItem = await FoodItemModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        error: 'Food item not found',
      });
    }

    const response: ApiResponse<FoodItem> = {
      success: true,
      data: foodItem.toObject() as FoodItem,
      message: 'Food item updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/food/:id - Delete food item
router.delete('/:id', async (req, res, next) => {
  try {
    const foodItem = await FoodItemModel.findByIdAndDelete(req.params.id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        error: 'Food item not found',
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Food item deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
