import { Router } from 'express';
import {
  getExpensesHandler,
  addExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler
} from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All expense routes require authentication
router.use(authenticateToken);

// GET /api/expenses - Get all expenses
router.get('/', getExpensesHandler);

// POST /api/expenses - Add new expense
router.post('/', addExpenseHandler);

// PUT /api/expenses/:id - Update expense
router.put('/:id', updateExpenseHandler);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', deleteExpenseHandler);

export default router;