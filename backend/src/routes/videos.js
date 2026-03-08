import { Router } from 'express';
import {
  getAllVideos,
  getPublishedVideos,
  getVideoById,
  deleteVideo,
} from '../db/repositories/videoRepository.js';
import { getAnalyticsByVideoId } from '../db/repositories/analyticsRepository.js';

const router = Router();

/**
 * GET /api/videos
 * Query params: ?published=true  → only ready videos (for users)
 */
router.get('/', async (req, res, next) => {
  try {
    const published = req.query.published === 'true';
    const videos = published ? await getPublishedVideos() : await getAllVideos();
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/videos/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const video = await getVideoById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const analytics = await getAnalyticsByVideoId(video.id);
    res.json({ ...video, analytics });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/videos/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteVideo(req.params.id);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
