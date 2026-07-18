/**
 * One-time script: translate all word names into ru/es/fr/de/zh using OpenAI.
 * Run: node server/translate-words.js
 * Requires: OPENAI_API_KEY and DATABASE_URL environment variables.
 */

import pg from 'pg'
import OpenAI from 'openai'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const TARGET_LANGS = ['ru', 'es', 'fr', 'de', 'zh']
const LANG_NAMES = { ru: 'Russian', es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese (Simplified)' }

async function translateWord(wordName, themeName) {
  const langList = TARGET_LANGS.map(l => `"${l}": "${LANG_NAMES[l]}"`).join(', ')
  const prompt = `Translate the word "${wordName}" (from the theme "${themeName}") into these languages. Return ONLY a valid JSON object with these exact keys: ${TARGET_LANGS.join(', ')}. Use the most common everyday word a child would know. Example format: {"ru":"кошка","es":"gato","fr":"chat","de":"Katze","zh":"猫"}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 120,
    response_format: { type: 'json_object' },
  })

  const text = response.choices[0].message.content.trim()
  return JSON.parse(text)
}

async function run() {
  const { rows: themes } = await pool.query('SELECT id, name FROM themes')
  const themeMap = Object.fromEntries(themes.map(t => [t.id, t.name]))

  const { rows: words } = await pool.query(`
    SELECT id, name, theme_id, translations
    FROM words
    ORDER BY theme_id, sort_order, name
  `)

  const toTranslate = words.filter(w => {
    const t = w.translations || {}
    return TARGET_LANGS.some(l => !t[l])
  })

  console.log(`Total words: ${words.length}, need translation: ${toTranslate.length}`)
  if (toTranslate.length === 0) {
    console.log('All words already translated.')
    await pool.end()
    return
  }

  let done = 0
  let failed = 0
  for (const word of toTranslate) {
    const themeName = themeMap[word.theme_id] || word.theme_id
    try {
      const existing = word.translations || {}
      const newTranslations = await translateWord(word.name, themeName)
      const merged = { ...existing, ...newTranslations }
      // Also store the English name explicitly
      if (!merged.en) merged.en = word.name

      await pool.query(
        'UPDATE words SET translations = $1 WHERE id = $2',
        [JSON.stringify(merged), word.id]
      )
      done++
      console.log(`[${done}/${toTranslate.length}] ${word.name} → ${JSON.stringify(newTranslations)}`)
    } catch (err) {
      failed++
      console.error(`FAILED: ${word.name} — ${err.message}`)
    }
    // Small delay to stay within rate limits
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\nDone: ${done} translated, ${failed} failed.`)
  await pool.end()
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
