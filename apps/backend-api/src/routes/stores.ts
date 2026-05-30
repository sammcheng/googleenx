import express from 'express';
import { StoreModel } from '../models/Store.js';
import { ApiResponse, Store, PaginatedResponse } from '@shared/types';

const router = express.Router();

// GET /api/stores - Get all stores with pagination
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const active = req.query.active as string;
    const search = req.query.search as string;

    const query: any = {};
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const [stores, total] = await Promise.all([
      StoreModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .lean(),
      StoreModel.countDocuments(query),
    ]);

    const response: PaginatedResponse<Store> = {
      data: stores as Store[],
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

// GET /api/stores/:id - Get store by ID
router.get('/:id', async (req, res, next) => {
  try {
    const store = await StoreModel.findById(req.params.id).lean();
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const response: ApiResponse<Store> = {
      success: true,
      data: store as Store,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/stores - Create new store
router.post('/', async (req, res, next) => {
  try {
    const store = new StoreModel(req.body);
    await store.save();

    const response: ApiResponse<Store> = {
      success: true,
      data: store.toObject() as Store,
      message: 'Store created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/stores/:id - Update store
router.put('/:id', async (req, res, next) => {
  try {
    const store = await StoreModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const response: ApiResponse<Store> = {
      success: true,
      data: store.toObject() as Store,
      message: 'Store updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/stores/:id - Delete store
router.delete('/:id', async (req, res, next) => {
  try {
    const store = await StoreModel.findByIdAndDelete(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Store deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
