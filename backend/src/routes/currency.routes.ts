import express from 'express';
import * as currencyController from '../controllers/currency.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/currency
 * Get all available currencies
 */
router.get('/', currencyController.getCurrencies);

/**
 * GET /api/currency/user
 * Get user's preferred currency
 */
router.get('/user', authenticateToken, currencyController.getUserPreferredCurrency);

/**
 * PUT /api/currency/user
 * Update user's preferred currency
 */
router.put('/user', authenticateToken, currencyController.updateUserPreferredCurrency);

export default router;
