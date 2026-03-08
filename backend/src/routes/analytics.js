import { Router } from 'express';
import { getAnalyticsSnapshot } from '../services/analyticsService.js';
import { getAllAnalytics } from '../db/repositories/analyticsRepository.js';
import { getGlobalHistory } from '../db/repositories/concurrentHistoryRepository.js';

const router = Router();

/**
 * GET /api/analytics
 * Returns aggregated analytics for admin dashboard (REST fallback).
 */
router.get('/', async (_req, res, next) => {
  try {
    const snapshot = await getAnalyticsSnapshot();
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/history?minutes=60
 * Returns time-series of concurrent viewer counts for graphing.
 */
router.get('/history', async (req, res, next) => {
  try {
    const minutes = parseInt(req.query.minutes, 10) || 60;
    const history = await getGlobalHistory(minutes);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

export default router;
