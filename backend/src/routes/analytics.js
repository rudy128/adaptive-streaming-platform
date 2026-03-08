import { Router } from 'express';
import { getAnalyticsSnapshot } from '../services/analyticsService.js';
import { getAllAnalytics } from '../db/repositories/analyticsRepository.js';

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

export default router;
