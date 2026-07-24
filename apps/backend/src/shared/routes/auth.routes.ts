import express, { Router, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { login, refresh, me } = require('../../modules/admin/controllers/authController');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authenticate = require('../middlewares/auth');

const router: Router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', (_req: Request, res: Response) => res.json({ success: true, message: 'Logged out' }));
router.post('/register', (_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Use /api/admin/auth for admin registration' }));

// Protected routes
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, (_req: Request, res: Response) => res.json({ success: false, message: 'Use /api/admin to change password' }));
router.post('/2fa/setup',   authenticate, (_req: Request, res: Response) => res.json({ success: false, message: '2FA not implemented' }));
router.post('/2fa/enable',  authenticate, (_req: Request, res: Response) => res.json({ success: false, message: '2FA not implemented' }));

export default router;
