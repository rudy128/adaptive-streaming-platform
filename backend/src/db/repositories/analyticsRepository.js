import { query } from '../../config/db.js';

export async function upsertAnalytics(videoId, { totalViews, concurrentViewers }) {
  const { rows } = await query(
    `INSERT INTO video_analytics (video_id, total_views, concurrent_viewers)
     VALUES ($1, $2, $3)
     ON CONFLICT (video_id)
     DO UPDATE SET
       total_views = COALESCE($2, video_analytics.total_views),
       concurrent_viewers = COALESCE($3, video_analytics.concurrent_viewers)
     RETURNING *`,
    [videoId, totalViews ?? 0, concurrentViewers ?? 0],
  );
  return rows[0];
}

export async function getAnalyticsByVideoId(videoId) {
  const { rows } = await query(
    'SELECT * FROM video_analytics WHERE video_id = $1',
    [videoId],
  );
  return rows[0] || null;
}

export async function getAllAnalytics() {
  const { rows } = await query(
    `SELECT va.*, v.title
     FROM video_analytics va
     JOIN videos v ON v.id = va.video_id
     ORDER BY va.total_views DESC`,
  );
  return rows;
}

export async function incrementTotalViews(videoId) {
  await query(
    `INSERT INTO video_analytics (video_id, total_views, concurrent_viewers)
     VALUES ($1, 1, 0)
     ON CONFLICT (video_id)
     DO UPDATE SET total_views = video_analytics.total_views + 1`,
    [videoId],
  );
}
