import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getFinancialSnapshotHandler, getFinancialTrajectoryHandler } from '../controllers/analysis.controller';

const router = Router();

/**
 * @route GET /api/analysis/snapshot
 * @desc Get financial snapshot for a specific date
 * @access Private
 */
router.get('/snapshot', authenticateToken, getFinancialSnapshotHandler);

/**
 * @route GET /api/analysis/trajectory
 * @desc Get financial trajectory over time for velocity and freedom gap visualization
 * @access Private
 */
router.get('/trajectory', authenticateToken, getFinancialTrajectoryHandler);

export default router;
