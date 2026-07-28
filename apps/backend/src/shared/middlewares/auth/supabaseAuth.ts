import { Request, Response, NextFunction } from 'express';
import { verifyAuth } from '@supabase/server/core';

export const authenticateSupabase = async (req: Request, res: Response, next: NextFunction) => {
  // Convert Express Request to Web API Request object nếu cần thiết
  const { data: auth, error } = await verifyAuth(req as any, {
    auth: 'user', // Chỉ chấp nhận user có JWT hợp lệ
  });

  if (error) {
    return res.status(error.status || 401).json({ error: error.message });
  }

  // Gán thông tin người dùng vào req
  // @ts-ignore
  req.user = auth.userClaims; 
  next();
};
