import { Request, Response, NextFunction } from 'express';
import { getFinancialSnapshot, getFinancialTrajectory } from '../services/analysis.service';

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

export async function getFinancialTrajectoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'monthly';
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const trajectory = await getFinancialTrajectory(userId, startDate, endDate, interval);
    
    return res.status(200).json(trajectory);
  } catch (error: any) {
    console.error('Get financial trajectory error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get financial trajectory' });
  }
}

