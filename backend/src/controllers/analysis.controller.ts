import { Request, Response, NextFunction } from 'express';
import { getFinancialSnapshot } from '../services/analysis.service';

export async function getFinancialSnapshotHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const date = req.query.date as string | undefined;
    
    const snapshot = await getFinancialSnapshot(userId, date);
    
    return res.status(200).json(snapshot);
  } catch (error: any) {
    console.error('Get financial snapshot error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get financial snapshot' });
  }
}
