import { query } from '../../config/db.js';

export async function createVideo({ title, description = '' }) {
  const { rows } = await query(
    `INSERT INTO videos (title, description)
     VALUES ($1, $2)
     RETURNING *`,
    [title, description],
  );
  return rows[0];
}

export async function getVideoById(id) {
  const { rows } = await query('SELECT * FROM videos WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getAllVideos() {
  const { rows } = await query(
    'SELECT * FROM videos ORDER BY created_at DESC',
  );
  return rows;
}

export async function getPublishedVideos() {
  const { rows } = await query(
    `SELECT * FROM videos WHERE status = 'ready' ORDER BY created_at DESC`,
  );
  return rows;
}

export async function updateVideo(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  const setClause = keys
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ');

  const { rows } = await query(
    `UPDATE videos SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return rows[0] || null;
}

export async function deleteVideo(id) {
  await query('DELETE FROM videos WHERE id = $1', [id]);
}
