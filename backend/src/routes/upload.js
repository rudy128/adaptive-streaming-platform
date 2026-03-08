import { Router } from 'express';
import upload from '../middleware/upload.js';
import { createVideo, getVideoById } from '../db/repositories/videoRepository.js';
import { uploadFile } from '../services/s3Service.js';
import { encodeVideo } from '../services/encodingService.js';

const router = Router();

router.post('/', upload.single('video'), async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const video = await createVideo({ title, description });

    const s3Key = `videos/${video.id}/original${getExtension(req.file.originalname)}`;
    uploadFile(s3Key, req.file.path, req.file.mimetype).catch((err) =>
      console.error('[Upload] S3 upload failed:', err),
    );

    encodeVideo(video.id, req.file.path).catch((err) =>
      console.error(`[Encoder] Failed for ${video.id}:`, err),
    );

    res.status(201).json({
      message: 'Upload started — video will be available once encoding completes.',
      video,
    });
  } catch (err) {
    next(err);
  }
});

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.slice(idx) : '';
}

export default router;
