import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { themes } from './seedData.js'
import { pool, query, ensureSchema } from './db.js'
import { uploadObject } from './storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSET_DIR = path.join(__dirname, 'seed-assets')

function readAsset(wordId) {
  const file = path.join(ASSET_DIR, `${wordId}.jpg`)
  if (!fs.existsSync(file)) return null
  const buf = fs.readFileSync(file)
  if (buf.length < 100) return null
  return buf
}

async function runPool(items, concurrency, worker) {
  let idx = 0
  let done = 0
  const total = items.length
  async function next() {
    while (idx < items.length) {
      const i = idx++
      try {
        await worker(items[i])
      } catch (err) {
        console.error(`  ! ${items[i].word.name}: ${err.message}`)
      }
      done++
      if (done % 20 === 0 || done === total) console.log(`  progress ${done}/${total}`)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next))
}

async function seed() {
  await ensureSchema()

  console.log('Seeding themes & words...')
  for (let ti = 0; ti < themes.length; ti++) {
    const t = themes[ti]
    await query(
      `INSERT INTO themes (id, name, icon, color, bg_color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, icon = EXCLUDED.icon,
         color = EXCLUDED.color, bg_color = EXCLUDED.bg_color,
         sort_order = EXCLUDED.sort_order`,
      [t.id, t.name, t.icon, t.color, t.bgColor, ti]
    )
    for (let wi = 0; wi < t.words.length; wi++) {
      const w = t.words[wi]
      await query(
        `INSERT INTO words (id, theme_id, name, emoji, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           theme_id = EXCLUDED.theme_id, name = EXCLUDED.name,
           emoji = EXCLUDED.emoji, sort_order = EXCLUDED.sort_order`,
        [w.id, t.id, w.name, w.emoji, wi]
      )
    }
  }

  const existing = await query('SELECT id FROM words WHERE image_path IS NOT NULL')
  const haveImage = new Set(existing.rows.map((r) => r.id))

  const pending = []
  for (const t of themes) {
    for (const w of t.words) {
      if (!haveImage.has(w.id)) pending.push({ word: w })
    }
  }
  console.log(`Uploading ${pending.length} photos from local assets (skipping ${haveImage.size} already stored)...`)

  let ok = 0
  await runPool(pending, 8, async ({ word }) => {
    const buf = readAsset(word.id)
    if (!buf) throw new Error(`missing local asset server/seed-assets/${word.id}.jpg`)
    const objPath = await uploadObject(buf, 'image/jpeg')
    await query('UPDATE words SET image_path = $2 WHERE id = $1', [word.id, objPath])
    ok++
  })

  const missing = await query('SELECT id FROM words WHERE image_path IS NULL')
  const withImg = await query('SELECT COUNT(*)::int AS c FROM words WHERE image_path IS NOT NULL')
  const totalWords = await query('SELECT COUNT(*)::int AS c FROM words')
  console.log(`Done. Newly stored: ${ok}. Words with photos: ${withImg.rows[0].c}/${totalWords.rows[0].c}`)

  if (missing.rows.length > 0) {
    throw new Error(
      `Seed incomplete: ${missing.rows.length} baseline words have no photo: ${missing.rows.map((r) => r.id).join(', ')}`
    )
  }
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Seed failed:', err)
    await pool.end().catch(() => {})
    process.exit(1)
  })
