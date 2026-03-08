import { query } from '../../config/db.js';

export async function recordSnapshot({ activeUsers, perVideo }) {
  await query(
    `INSERT INTO concurrent_history (active_users, video_id, viewers)
     VALUES ($1, NULL, $1)`,
    [activeUsers],
  );

  for (const { videoId, viewers } of perVideo) {
    await query(
      `INSERT INTO concurrent_history (active_users, video_id, viewers)
       VALUES ($1, $2, $3)`,
      [activeUsers, videoId, viewers],
    );
  }
}

export async function getGlobalHistory(minutes = 60) {
  const { rows } = await query(
    `SELECT recorded_at, active_users
     FROM concurrent_history
     WHERE video_id IS NULL
       AND recorded_at > NOW() - INTERVAL '1 minute' * $1
     ORDER BY recorded_at ASC`,
    [minutes],
  );
  return rows;
}

export async function getVideoHistory(videoId, minutes = 60) {
  const { rows } = await query(
    `SELECT recorded_at, viewers
     FROM concurrent_history
     WHERE video_id = $1
       AND recorded_at > NOW() - INTERVAL '1 minute' * $1
     ORDER BY recorded_at ASC`,
    [videoId, minutes],
  );
  return rows;
}

export async function purgeOldHistory(hours = 24) {
  const { rowCount } = await query(
    `DELETE FROM concurrent_history
     WHERE recorded_at < NOW() - INTERVAL '1 hour' * $1`,
    [hours],
  );
  return rowCount;
}
