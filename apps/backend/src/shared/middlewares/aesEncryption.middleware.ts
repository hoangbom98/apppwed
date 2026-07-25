/**
 * aesEncryption.middleware.ts
 * Middleware bảo mật AES-ECB cho API endpoints (mô phỏng BoYue).
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const AES_KEY = process.env.API_AES_KEY || '1234567890123456';

export function aesMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' && req.body.params) {
    // Giải mã AES-ECB từ req.body.params
    try {
      const decipher = crypto.createDecipheriv('aes-128-ecb', AES_KEY, null);
      let decrypted = decipher.update(req.body.params, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      req.body = JSON.parse(decrypted);
    } catch (e) {
      return res.status(401).json({ error: 'Decryption failed' });
    }
  }
  next();
}
