/**
 * verifySignedUrl.ts — Express middleware để xác minh HMAC signed URL
 *
 * Dùng khi STORAGE_PROVIDER=local và bạn muốn bảo vệ file private
 * bằng cách require URL có token hợp lệ (tạo từ storageAdapter.getSignedUrl).
 *
 * Token format (appended by LocalAdapter.getSignedUrl):
 *   /uploads/receipts/bankapp/file.pdf?expires=<unix>&token=<hmac16>
 *
 * Usage trong routes:
 *   import { verifySignedUrl } from '../../shared/middlewares';
 *   // Mount on the static-file path BEFORE express.static:
 *   app.use('/uploads/receipts', verifySignedUrl, express.static(UPLOAD_DIR));
 *
 * NOTE: Khi STORAGE_PROVIDER=s3 (Cloudflare R2), bạn không cần middleware này
 * vì R2 pre-signed URLs được xác thực bởi AWS SigV4 — R2 tự từ chối URL giả mạo.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Verify ?expires=<ts>&token=<hmac> params appended by LocalAdapter.getSignedUrl.
 * Returns 401 if missing, 403 if expired or tampered.
 */
export const verifySignedUrl = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip check when not using local storage — R2/Supabase sign their own URLs
  if ((process.env.STORAGE_PROVIDER || 'local') !== 'local') {
    next();
    return;
  }

  const { expires, token } = req.query as { expires?: string; token?: string };

  if (!expires || !token) {
    res.status(401).json({
      success: false,
      error: { code: 'MISSING_SIGNED_URL_PARAMS', message: 'URL không hợp lệ — thiếu tham số xác thực' },
    });
    return;
  }

  // Check expiry first (cheap)
  const expiresTs = parseInt(expires, 10);
  if (isNaN(expiresTs) || Math.floor(Date.now() / 1000) > expiresTs) {
    res.status(403).json({
      success: false,
      error: { code: 'SIGNED_URL_EXPIRED', message: 'URL đã hết hạn — vui lòng yêu cầu URL mới' },
    });
    return;
  }

  // Re-derive the relative path from req.path (strip leading /)
  const relativePath = req.path.replace(/^\//, '');
  const secret = process.env.JWT_SECRET || 'local-dev-secret';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${relativePath}:${expires}`)
    .digest('hex')
    .slice(0, 16);

  // Constant-time comparison to prevent timing attacks
  const tokenBuf    = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  const valid =
    tokenBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(tokenBuf, expectedBuf);

  if (!valid) {
    res.status(403).json({
      success: false,
      error: { code: 'INVALID_SIGNED_URL_TOKEN', message: 'Token không hợp lệ' },
    });
    return;
  }

  next();
};
