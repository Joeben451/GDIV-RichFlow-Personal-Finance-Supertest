import { Request, Response } from 'express';
import * as currencyService from '../services/currency.service';

/**
 * Get all available currencies
 */
export const getCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = await currencyService.getAllCurrencies();
    res.status(200).json(currencies);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch currencies',
    });
  }
};

/**
 * Get user's current preferred currency
 */
export const getUserPreferredCurrency = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currency = await currencyService.getUserCurrency(userId);
    res.status(200).json(currency);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch user currency',
    });
  }
};

/**
 * Update user's preferred currency
 */
export const updateUserPreferredCurrency = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currencyId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!currencyId || typeof currencyId !== 'number') {
      return res.status(400).json({ error: 'Valid currency ID is required' });
    }

    await currencyService.updateUserCurrency(userId, currencyId);
    const updatedCurrency = await currencyService.getUserCurrency(userId);
    
    res.status(200).json({
      message: 'Currency preference updated successfully',
      preferredCurrency: updatedCurrency,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Currency not found') {
      return res.status(404).json({ error: 'Currency not found' });
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update currency preference',
    });
  }
};
