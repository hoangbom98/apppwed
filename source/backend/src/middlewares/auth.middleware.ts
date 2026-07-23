// @ts-nocheck
/* eslint-disable */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service';
const logger = require('../shared/logger');
import { rateLimit } from 'express-rate-limit';

const authService = new AuthService();

// ===== 1. Xác thực JWT từ Cookie hoặc Header =====
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy token từ cookie (httpOnly) hoặc header
    const token = req.cookies?.['access_token'] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 401 },
      });
    }

    const payload = await authService.verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token', code: 401 },
      });
    }

    // Gắn user vào request
    (req as any).user = payload.user;
    (req as any).token = token;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication failed', code: 401 },
    });
  }
};

// ===== 2. Phân quyền =====
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authenticated', code: 401 },
      });
    }

    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions', code: 403 },
      });
    }

    next();
  };
};

// ===== 3. Rate limiting theo user/IP =====
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit theo user ID nếu có, hoặc IP
    return (req as any).user?.id || req.ip || 'anonymous';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please slow down',
        code: 429,
      },
    });
  },
});

// ===== 4. Rate limiting login =====
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many login attempts, please try again later',
        code: 429,
      },
    });
  },
});
