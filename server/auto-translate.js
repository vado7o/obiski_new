/**
 * Auto-translate words that have empty translations.
 * Uses Lingva Translate (open-source Google Translate frontend, no API key)
 * with MyMemory as a fallback. Safe to call on every server start —
 * only processes words whose translations are null, {}, or all-empty strings.
 */

const TARGET_LANGS = ['ru', 'es', 'fr', 'de', 'zh']

// Multiple public Lingva instances — tried in order until one succeeds
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.thedaviddelta.com',
]

// MyMemory language codes (fallback)
const MY_MEMORY_CODES = {
  ru: 'ru-RU',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
}

async function translateWithLingva(text, lang) {
  for (const base of LINGVA_INSTANCES) {
    try {
      const url = `${base}/api/v1/en/${lang}/${encodeURIComponent(text)}`
      const res = await fetch(url, { signal: AbortSignal.timeout(9_000) })
      if (!res.ok) continue
      const data = await res.json()
      if (data.translation && !data.translation.toLowerCase().includes('error')) {
        return data.translation
      }
    } catch { /* try next instance */ }
  }
  throw new Error('All Lingva instances failed')
}

async function translateWithMyMemory(text, lang) {
  const code = MY_MEMORY_CODES[lang]
  const url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}&langpair=en-US|${code}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
  const data = await res.json()
  if (
    data.responseStatus === 200 &&
    data.responseData?.translatedText &&
    !data.responseData.translatedText.toUpperCase().includes('MYMEMORY WARNING')
  ) {
    return data.responseData.translatedText
  }
  throw new Error(`MyMemory: ${data.responseStatus} ${data.responseDetails || ''}`)
}

async function translateOne(text, lang) {
  try {
    return await translateWithLingva(text, lang)
  } catch (lingvaErr) {
    try {
      return await translateWithMyMemory(text, lang)
    } catch (mmErr) {
      throw new Error(`Lingva: ${lingvaErr.message} | MyMemory: ${mmErr.message}`)
    }
  }
}

/**
 * Find every word whose translations are empty and fill them in.
 * Runs as a fire-and-forget task — does not block server startup.
 */
export async function autoTranslateMissing(pool) {
  let rows
  try {
    const result = await pool.query(`
      SELECT w.id, w.name
      FROM words w
      WHERE w.translations IS NULL
         OR w.translations = '{}'
         OR NOT EXISTS (
           SELECT 1 FROM jsonb_each_text(w.translations) j(k, v) WHERE v <> ''
         )
      ORDER BY w.name
    `)
    rows = result.rows
  } catch (err) {
    console.error('[auto-translate] DB query failed:', err.message)
    return
  }

  if (rows.length === 0) return

  console.log(`[auto-translate] Found ${rows.length} word(s) to translate…`)

  for (const word of rows) {
    const t = { en: word.name }

    for (const lang of TARGET_LANGS) {
      try {
        t[lang] = await translateOne(word.name, lang)
        await new Promise(r => setTimeout(r, 300)) // rate-limit courtesy delay
      } catch (e) {
        console.warn(`[auto-translate] ${word.name}→${lang}: ${e.message}`)
        t[lang] = ''
      }
    }

    try {
      await pool.query(
        'UPDATE words SET translations = $1 WHERE id = $2',
        [JSON.stringify(t), word.id]
      )
      console.log(`[auto-translate] ✓ "${word.name}"  ru:"${t.ru}"  es:"${t.es}"  de:"${t.de}"`)
    } catch (e) {
      console.error(`[auto-translate] DB update failed for "${word.name}": ${e.message}`)
    }
  }

  console.log('[auto-translate] Done.')
}
