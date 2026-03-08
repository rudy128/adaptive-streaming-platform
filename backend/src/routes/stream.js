import { Router } from 'express';
import { getVideoById } from '../db/repositories/videoRepository.js';

const router = Router();

router.get('/:videoId/master.m3u8', async (req, res, next) => {
  try {
    const video = await getVideoById(req.params.videoId);

    if (!video || !video.master_playlist_url) {
      return res.status(404).json({ error: 'Stream not available' });
    }

    res.redirect(video.master_playlist_url);
  } catch (err) {
    next(err);
  }
});

export default router;
