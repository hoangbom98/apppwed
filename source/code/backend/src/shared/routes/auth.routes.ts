import express, { Router } from 'express';
// auth.controller is a legacy file with @ts-nocheck — use require to avoid type bleed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { register, login, logout, refresh, me, changePassword, setup2FA, enable2FA } = require('../../modules/admin/controllers/auth.controller');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authenticate = require('../middlewares/auth');

const router: Router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/enable', authenticate, enable2FA);

export default router;
