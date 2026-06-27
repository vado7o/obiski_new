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
}
