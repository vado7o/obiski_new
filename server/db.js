import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export function query(text, params) {
  return pool.query(text, params)
}

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      bg_color TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      emoji TEXT,
      image_path TEXT,
      audio_path TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_words_theme ON words(theme_id);')

  // Session store for Replit Auth (connect-pg-simple)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);')

  // Application users (one row per logged-in person)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Each user's personal "folder" for their settings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Anonymous + registered visit tracking
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_visits (
      id         BIGSERIAL PRIMARY KEY,
      anon_id    TEXT NOT NULL,
      user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
      visited_at TIMESTAMPTZ DEFAULT NOW(),
      device     TEXT,
      lang       TEXT
    );
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_app_visits_anon ON app_visits(anon_id);')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_app_visits_at  ON app_visits(visited_at);')

  // Game-round results
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_rounds (
      id            BIGSERIAL PRIMARY KEY,
      anon_id       TEXT NOT NULL,
      user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
      themes        TEXT[],
      difficulty    INTEGER,
      cards_total   INTEGER,
      cards_correct INTEGER,
      started_at    TIMESTAMPTZ,
      ended_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_game_rounds_anon ON game_rounds(anon_id);')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_game_rounds_at  ON game_rounds(ended_at);')

  // Feedback sounds: up to 5 per language per type (correct / incorrect)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback_sounds (
      lang TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('correct', 'incorrect')),
      slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 5),
      object_path TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (lang, type, slot)
    );
  `)

  // Title sound: single global sound played on the main screen
  await pool.query(`
    CREATE TABLE IF NOT EXISTS title_sound (
      id INTEGER PRIMARY KEY DEFAULT 1,
      object_path TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CHECK (id = 1)
    );
  `)
}
