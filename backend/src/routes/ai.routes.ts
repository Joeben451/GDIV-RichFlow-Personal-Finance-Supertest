import { Router } from 'express';
import { analyzeFinanceController } from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/showinformation', authenticateToken, analyzeFinanceController);

export default router;