import { themes } from './seedData.js'
import { pool, query } from './db.js'
import { uploadObject } from './storage.js'

async function fetchImage(url, attempt = 0) {
  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), 20000)
  try {
    const r = await fetch(url, { signal: ac.signal, redirect: 'follow' })
    if (!r.ok) throw new Error(`status ${r.status}`)
    const ct = r.headers.get('content-type') || 'image/jpeg'
    if (!ct.startsWith('image/')) throw new Error(`not image (${ct})`)
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length < 1000) throw new Error('image too small')
    return { buf, ct }
  } catch (err) {
    if (attempt < 2) {
      await new Promise((res) => setTimeout(res, 800 * (attempt + 1)))
      return fetchImage(url, attempt + 1)
    }
    throw err
  } finally {
    clearTimeout(to)
  }
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
  console.log(`Fetching ${pending.length} photos (skipping ${haveImage.size} already stored)...`)

  let ok = 0
  await runPool(pending, 5, async ({ word }) => {
    const { buf, ct } = await fetchImage(word.imageUrl)
    const path = await uploadObject(buf, ct)
    await query('UPDATE words SET image_path = $2 WHERE id = $1', [word.id, path])
    ok++
  })

  const withImg = await query('SELECT COUNT(*)::int AS c FROM words WHERE image_path IS NOT NULL')
  const totalWords = await query('SELECT COUNT(*)::int AS c FROM words')
  console.log(`Done. Newly stored: ${ok}. Words with photos: ${withImg.rows[0].c}/${totalWords.rows[0].c}`)
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Seed failed:', err)
    await pool.end().catch(() => {})
    process.exit(1)
  })
