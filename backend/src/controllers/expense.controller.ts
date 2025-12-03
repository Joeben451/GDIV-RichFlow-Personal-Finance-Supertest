import { Request, Response, NextFunction } from 'express';
import { addExpense, getExpenses, updateExpense, deleteExpense } from '../services/expense.service.js';

/**
 * Get all expenses for the authenticated user
 * @route GET /api/expenses
 */
export async function getExpensesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const expenses = await getExpenses(userId);
    return res.status(200).json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Add a new expense
 * @route POST /api/expenses
 */
export async function addExpenseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { name, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    if (!name || typeof amount !== 'number') {
      return res.status(400).json({
        error: 'Name and amount are required. Amount must be a number.'
      });
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' });
    }

    const expense = await addExpense(userId, { name, amount });

    return res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update an expense
 * @route PUT /api/expenses/:id
 */
export async function updateExpenseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const expenseId = parseInt(String(req.params.id), 10);
    const { name, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    // Validate input
    if (!name || typeof amount !== 'number') {
      return res.status(400).json({
        error: 'Name and amount are required. Amount must be a number.'
      });
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' });
    }

    const updatedExpense = await updateExpense(userId, expenseId, {
      name,
      amount
    });

    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.status(200).json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete an expense
 * @route DELETE /api/expenses/:id
 */
export async function deleteExpenseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const expenseId = parseInt(String(req.params.id), 10);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const deleted = await deleteExpense(userId, expenseId);

    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.status(200).json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}