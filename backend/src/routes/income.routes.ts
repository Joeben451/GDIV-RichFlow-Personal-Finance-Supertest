import { Router } from 'express';
import {
  getIncomeLinesHandler,
  addIncomeLineHandler,
  updateIncomeLineHandler,
  deleteIncomeLineHandler
} from '../controllers/income.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All income routes require authentication
router.use(authenticateToken);

// GET /api/income - Get all income lines
router.get('/', getIncomeLinesHandler);

// POST /api/income - Add new income line
router.post('/', addIncomeLineHandler);

// PUT /api/income/:id - Update income line
router.put('/:id', updateIncomeLineHandler);

// DELETE /api/income/:id - Delete income line
router.delete('/:id', deleteIncomeLineHandler);

export default router;