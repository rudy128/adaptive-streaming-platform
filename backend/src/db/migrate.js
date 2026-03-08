import { query } from '../config/db.js';

/**
 * Run all database migrations.
 * Idempotent – safe to run multiple times.
 */
async function migrate() {
  console.log('[DB] Running migrations…');

  await query(`
    CREATE TABLE IF NOT EXISTS videos (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title         VARCHAR(255)  NOT NULL,
      description   TEXT          DEFAULT '',
      thumbnail_url TEXT,
      master_playlist_url TEXT,
      duration      REAL          DEFAULT 0,
      status        VARCHAR(32)   DEFAULT 'pending',
      created_at    TIMESTAMPTZ   DEFAULT NOW(),
      updated_at    TIMESTAMPTZ   DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS video_views (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      session_id  VARCHAR(128) NOT NULL,
      started_at  TIMESTAMPTZ  DEFAULT NOW(),
      ended_at    TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS video_analytics (
      video_id            UUID PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
      total_views         INTEGER DEFAULT 0,
      concurrent_viewers  INTEGER DEFAULT 0
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_video_views_session_id ON video_views(session_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS concurrent_history (
      id            SERIAL PRIMARY KEY,
      recorded_at   TIMESTAMPTZ DEFAULT NOW(),
      active_users  INTEGER DEFAULT 0,
      video_id      UUID REFERENCES videos(id) ON DELETE CASCADE,
      viewers       INTEGER DEFAULT 0
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_concurrent_history_recorded_at ON concurrent_history(recorded_at);
  `);

  console.log('[DB] Migrations complete ✓');
}

// Run directly: node src/db/migrate.js
migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  });
