import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getFinancialSnapshotHandler, getFinancialTrajectoryHandler, createSnapshotHandler } from '../controllers/analysis.controller.js';

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

/**
 * @route POST /api/analysis/snapshot
 * @desc Manually trigger a financial snapshot creation
 * @access Private
 */
router.post('/snapshot', authenticateToken, createSnapshotHandler);

export default router;
