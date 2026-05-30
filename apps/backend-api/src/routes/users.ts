import express from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { ApiResponse, User } from '@shared/types';

const router = express.Router();

// POST /api/users/register - Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    const user = new UserModel({
      email,
      password,
      name,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: user.toObject() as User,
        token,
      },
      message: 'User registered successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: user.toObject() as User,
        token,
      },
      message: 'Login successful',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/profile - Get user profile (protected route)
router.get('/profile', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user.toObject() as User,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    next(error);
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await UserModel.findByIdAndUpdate(
      decoded.userId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user.toObject() as User,
      message: 'Profile updated successfully',
    };

    res.json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    next(error);
  }
});

export default router;
