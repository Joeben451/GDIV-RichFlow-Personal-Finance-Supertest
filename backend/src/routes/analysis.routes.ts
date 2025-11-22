import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getFinancialSnapshotHandler } from '../controllers/analysis.controller';

const router = Router();

/**
 * @route GET /api/analysis/snapshot
 * @desc Get financial snapshot for a specific date
 * @access Private
 */
router.get('/snapshot', authenticateToken, getFinancialSnapshotHandler);

export default router;
