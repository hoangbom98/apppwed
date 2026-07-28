import express, { Router, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { login, refresh, me } = require('../../../modules/admin/controllers/authController');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authenticate = require('../../middlewares/auth/auth');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { clearAuthCookies } = require('../../../config/cookie.config');

const router: Router = express.Router();

// ── Admin auth ────────────────────────────────────────────────────────────────
router.post('/login',    login);
router.post('/refresh',  refresh);
router.get('/me',        authenticate, me);

// ── Logout — xóa cookie httpOnly + trả success ────────────────────────────────
// clearAuthCookies() xóa access_token và refresh_token cookie (httpOnly).
// Client cũng tự xóa localStorage qua _clearTokenStorage() trong sharedStores.
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Đã đăng xuất' });
});

router.post('/register', (_req: Request, res: Response) =>
  res.status(404).json({ success: false, message: 'Use /api/admin/auth for admin registration' })
);

// ── Change-password / 2FA stubs (not yet implemented at this level) ──────────
router.post('/change-password', authenticate, (_req: Request, res: Response) =>
  res.json({ success: false, message: 'Use /api/admin to change password' })
);
router.post('/2fa/setup',  authenticate, (_req: Request, res: Response) =>
  res.json({ success: false, message: '2FA not implemented' })
);
router.post('/2fa/enable', authenticate, (_req: Request, res: Response) =>
  res.json({ success: false, message: '2FA not implemented' })
);

export default router;
