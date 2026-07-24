// src/modules/sports/routes/index.ts
import { Router } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authenticate = require('../../../shared/middlewares/auth');

const router = Router();

// Lazy-load controller to avoid circular dep at startup
router.get('/', authenticate, (req, res) => res.json({ success: true, data: [] }));
router.post('/sync', authenticate, async (_req, res) => {
  res.json({ success: true, message: 'Sports sync endpoint available' });
});

export default router;
