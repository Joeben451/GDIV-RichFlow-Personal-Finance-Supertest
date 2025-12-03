import { Router } from 'express';
import {
  getBalanceSheetHandler,
  createBalanceSheetHandler,
  getAssetsHandler,
  addAssetHandler,
  updateAssetHandler,
  deleteAssetHandler,
  getLiabilitiesHandler,
  addLiabilityHandler,
  updateLiabilityHandler,
  deleteLiabilityHandler
} from '../controllers/balanceSheet.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Balance Sheet routes (all require authentication)
router.get('/balance-sheet', authenticateToken, getBalanceSheetHandler);
router.post('/balance-sheet', authenticateToken, createBalanceSheetHandler);

// Asset routes (all require authentication)
router.get('/assets', authenticateToken, getAssetsHandler);
router.post('/assets', authenticateToken, addAssetHandler);
router.put('/assets/:id', authenticateToken, updateAssetHandler);
router.delete('/assets/:id', authenticateToken, deleteAssetHandler);

// Liability routes (all require authentication)
router.get('/liabilities', authenticateToken, getLiabilitiesHandler);
router.post('/liabilities', authenticateToken, addLiabilityHandler);
router.put('/liabilities/:id', authenticateToken, updateLiabilityHandler);
router.delete('/liabilities/:id', authenticateToken, deleteLiabilityHandler);

export default router;
