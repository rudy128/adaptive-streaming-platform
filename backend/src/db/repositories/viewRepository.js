import { query } from '../../config/db.js';

export async function createView({ videoId, sessionId }) {
  const { rows } = await query(
    `INSERT INTO video_views (video_id, session_id)
     VALUES ($1, $2)
     RETURNING *`,
    [videoId, sessionId],
  );
  return rows[0];
}

export async function endView(sessionId) {
  const { rows } = await query(
    `UPDATE video_views SET ended_at = NOW()
     WHERE session_id = $1 AND ended_at IS NULL
     RETURNING *`,
    [sessionId],
  );
  return rows[0] || null;
}

export async function getViewsByVideoId(videoId) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS total FROM video_views WHERE video_id = $1',
    [videoId],
  );
  return rows[0].total;
}
