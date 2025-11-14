import { Request, Response, NextFunction } from 'express';
import { addIncomeLine, getIncomeLines, updateIncomeLine, deleteIncomeLine } from '../services/income.service';

/**
 * Get all income lines for the authenticated user
 * @route GET /api/income
 */
export async function getIncomeLinesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const incomeLines = await getIncomeLines(userId);
    return res.status(200).json(incomeLines);
  } catch (error) {
    console.error('Get income lines error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Add a new income line
 * @route POST /api/income
 */
export async function addIncomeLineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { name, amount, type } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    if (!name || typeof amount !== 'number' || !type) {
      return res.status(400).json({
        error: 'Name, amount, and type are required. Amount must be a number.'
      });
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' });
    }

    // Validate income type
    const validTypes = ['Earned', 'Portfolio', 'Passive'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Type must be one of: Earned, Portfolio, Passive'
      });
    }

    const incomeLine = await addIncomeLine(userId, { name, amount, type });

    return res.status(201).json({
      message: 'Income line added successfully',
      incomeLine
    });
  } catch (error) {
    console.error('Add income line error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update an income line
 * @route PUT /api/income/:id
 */
export async function updateIncomeLineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
  const incomeLineId = parseInt(String(req.params.id), 10);
    const { name, amount, type } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(incomeLineId)) {
      return res.status(400).json({ error: 'Invalid income line ID' });
    }

    // Validate input
    if (!name || typeof amount !== 'number' || !type) {
      return res.status(400).json({
        error: 'Name, amount, and type are required. Amount must be a number.'
      });
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' });
    }

    // Validate income type
    const validTypes = ['Earned', 'Portfolio', 'Passive'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Type must be one of: Earned, Portfolio, Passive'
      });
    }

    const updatedIncomeLine = await updateIncomeLine(userId, incomeLineId, {
      name,
      amount,
      type
    });

    if (!updatedIncomeLine) {
      return res.status(404).json({ error: 'Income line not found' });
    }

    return res.status(200).json({
      message: 'Income line updated successfully',
      incomeLine: updatedIncomeLine
    });
  } catch (error) {
    console.error('Update income line error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete an income line
 * @route DELETE /api/income/:id
 */
export async function deleteIncomeLineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
  const incomeLineId = parseInt(String(req.params.id), 10);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(incomeLineId)) {
      return res.status(400).json({ error: 'Invalid income line ID' });
    }

    const deleted = await deleteIncomeLine(userId, incomeLineId);

    if (!deleted) {
      return res.status(404).json({ error: 'Income line not found' });
    }

    return res.status(200).json({
      message: 'Income line deleted successfully'
    });
  } catch (error) {
    console.error('Delete income line error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}