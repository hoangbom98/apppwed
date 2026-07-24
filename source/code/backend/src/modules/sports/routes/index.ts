// src/modules/sports/routes/index.ts
import { Router } from 'express';
import { SportsController } from '../controllers/sports.controller';
import { authenticate } from '../../../core/middleware/auth.middleware';

const router = Router();
const controller = new SportsController();

router.use(authenticate);

router.get('/', controller.getEvents.bind(controller));
router.post('/sync', controller.syncEvents.bind(controller));

export default router;
