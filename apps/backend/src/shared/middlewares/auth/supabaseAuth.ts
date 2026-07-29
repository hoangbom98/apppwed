/**
 * supabaseAuth.ts — Express middleware xác thực Supabase JWT
 *
 * Luồng:
 *   1. Đọc Bearer token từ Authorization header
 *   2. Gọi supabase.auth.getUser(token) — verify JWT với Supabase Auth server
 *   3. Nếu hợp lệ: gán req.supabaseUser + req.supabaseToken, gọi next()
 *   4. Nếu lỗi:    trả 401 JSON
 *
 * Dùng khi muốn xác thực bằng Supabase Auth thay JWT nội bộ.
 * Middleware JWT nội bộ vẫn dùng authenticateJWT (auth middleware khác).
 */

import { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { supabaseAnon } from '../../services/supabaseClient';

// Mở rộng Express.Request để thêm trường Supabase
declare global {
  namespace Express {
    interface Request {
      /** Supabase Auth user object (populated by authenticateSupabase middleware) */
      supabaseUser?: User;
      /** Raw Supabase JWT token */
      supabaseToken?: string;
    }
  }
}

/**
 * Middleware: xác thực Supabase JWT từ Authorization: Bearer <token>
 *
 * @example
 * router.get('/profile', authenticateSupabase, profileController.getMe);
 */
export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Kiểm tra Supabase đã được cấu hình chưa
  if (!process.env.SUPABASE_URL) {
    res.status(503).json({
      success: false,
      error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase Auth chưa được cấu hình' },
    });
    return;
  }

  // Lấy token từ Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Authorization header thiếu hoặc không hợp lệ' },
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  // Verify JWT với Supabase Auth server
  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: error?.message ?? 'Token không hợp lệ hoặc đã hết hạn' },
    });
    return;
  }

  // Gán user vào request
  req.supabaseUser = data.user;
  req.supabaseToken = token;
  next();
};
