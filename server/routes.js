import multer from 'multer'
import { nanoid } from 'nanoid'
import { query } from './db.js'
import { requireAdmin, registerAuthRoutes } from './auth.js'
import {
  uploadObject,
  deleteObject,
  getObjectEntityFile,
  downloadObject,
  ObjectNotFoundError,
} from './storage.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function mapWord(row) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji || '',
    imageUrl: row.image_path || null,
    audioUrl: row.audio_path || null,
    themeId: row.theme_id,
  }
}

function mapTheme(row, words) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '',
    color: row.color || '#888',
    bgColor: row.bg_color || '#eee',
    words: words || [],
  }
}

async function uniqueThemeId(base) {
  let id = slugify(base) || `theme-${nanoid(6)}`
  const exists = await query('SELECT 1 FROM themes WHERE id = $1', [id])
  if (exists.rowCount > 0) id = `${id}-${nanoid(4)}`
  return id
}

export function registerRoutes(app) {
  registerAuthRoutes(app)

  // ---- Public content (game) ----
  app.get('/api/content', async (req, res) => {
    try {
      const themesRes = await query('SELECT * FROM themes ORDER BY sort_order, name')
      const wordsRes = await query('SELECT * FROM words ORDER BY sort_order, name')
      const byTheme = {}
      for (const w of wordsRes.rows) {
        ;(byTheme[w.theme_id] ||= []).push(mapWord(w))
      }
      const themes = themesRes.rows.map((t) => mapTheme(t, byTheme[t.id]))
      res.json({ themes })
    } catch (err) {
      console.error('GET /api/content failed:', err)
      res.status(500).json({ error: 'failed_to_load_content' })
    }
  })

  // ---- Serve stored media ----
  app.get('/objects/*objectPath', async (req, res) => {
    try {
      const file = await getObjectEntityFile(req.path)
      await downloadObject(file, res)
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: 'not_found' })
      }
      console.error('Error serving object:', err)
      res.status(500).json({ error: 'failed_to_serve' })
    }
  })

  // ---- Admin: themes ----
  app.post('/api/admin/themes', requireAdmin, async (req, res) => {
    try {
      const { name, icon, color, bgColor } = req.body || {}
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'name_required' })
      }
      const id = await uniqueThemeId(name)
      const orderRes = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM themes')
      const sortOrder = orderRes.rows[0].next
      const result = await query(
        `INSERT INTO themes (id, name, icon, color, bg_color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, String(name).trim(), icon || '📚', color || '#6C63FF', bgColor || '#EDEBFF', sortOrder]
      )
      res.status(201).json(mapTheme(result.rows[0], []))
    } catch (err) {
      console.error('create theme failed:', err)
      res.status(500).json({ error: 'create_failed' })
    }
  })

  app.put('/api/admin/themes/:id', requireAdmin, async (req, res) => {
    try {
      const { name, icon, color, bgColor } = req.body || {}
      const result = await query(
        `UPDATE themes SET
           name = COALESCE($2, name),
           icon = COALESCE($3, icon),
           color = COALESCE($4, color),
           bg_color = COALESCE($5, bg_color)
         WHERE id = $1 RETURNING *`,
        [req.params.id, name ?? null, icon ?? null, color ?? null, bgColor ?? null]
      )
      if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' })
      res.json(mapTheme(result.rows[0], []))
    } catch (err) {
      console.error('update theme failed:', err)
      res.status(500).json({ error: 'update_failed' })
    }
  })

  app.delete('/api/admin/themes/:id', requireAdmin, async (req, res) => {
    try {
      const media = await query(
        'SELECT image_path, audio_path FROM words WHERE theme_id = $1',
        [req.params.id]
      )
      const result = await query('DELETE FROM themes WHERE id = $1', [req.params.id])
      if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' })
      for (const row of media.rows) {
        await deleteObject(row.image_path)
        await deleteObject(row.audio_path)
      }
      res.json({ ok: true })
    } catch (err) {
      console.error('delete theme failed:', err)
      res.status(500).json({ error: 'delete_failed' })
    }
  })

  // ---- Admin: words ----
  app.post('/api/admin/words', requireAdmin, async (req, res) => {
    try {
      const { themeId, name, emoji } = req.body || {}
      if (!themeId) return res.status(400).json({ error: 'theme_required' })
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'name_required' })
      const theme = await query('SELECT 1 FROM themes WHERE id = $1', [themeId])
      if (theme.rowCount === 0) return res.status(400).json({ error: 'theme_not_found' })
      const id = `${slugify(name) || 'word'}-${nanoid(6)}`
      const orderRes = await query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM words WHERE theme_id = $1',
        [themeId]
      )
      const result = await query(
        `INSERT INTO words (id, theme_id, name, emoji, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, themeId, String(name).trim(), emoji || '', orderRes.rows[0].next]
      )
      res.status(201).json(mapWord(result.rows[0]))
    } catch (err) {
      console.error('create word failed:', err)
      res.status(500).json({ error: 'create_failed' })
    }
  })

  app.put('/api/admin/words/:id', requireAdmin, async (req, res) => {
    try {
      const { name, emoji, themeId } = req.body || {}
      if (themeId) {
        const theme = await query('SELECT 1 FROM themes WHERE id = $1', [themeId])
        if (theme.rowCount === 0) return res.status(400).json({ error: 'theme_not_found' })
      }
      const result = await query(
        `UPDATE words SET
           name = COALESCE($2, name),
           emoji = COALESCE($3, emoji),
           theme_id = COALESCE($4, theme_id)
         WHERE id = $1 RETURNING *`,
        [req.params.id, name ?? null, emoji ?? null, themeId ?? null]
      )
      if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' })
      res.json(mapWord(result.rows[0]))
    } catch (err) {
      console.error('update word failed:', err)
      res.status(500).json({ error: 'update_failed' })
    }
  })

  app.delete('/api/admin/words/:id', requireAdmin, async (req, res) => {
    try {
      const existing = await query(
        'SELECT image_path, audio_path FROM words WHERE id = $1',
        [req.params.id]
      )
      if (existing.rowCount === 0) return res.status(404).json({ error: 'not_found' })
      await query('DELETE FROM words WHERE id = $1', [req.params.id])
      await deleteObject(existing.rows[0].image_path)
      await deleteObject(existing.rows[0].audio_path)
      res.json({ ok: true })
    } catch (err) {
      console.error('delete word failed:', err)
      res.status(500).json({ error: 'delete_failed' })
    }
  })

  // ---- Admin: media uploads ----
  async function handleMediaUpload(req, res, column, allowedPrefix) {
    if (!req.file) return res.status(400).json({ error: 'file_required' })
    if (!req.file.mimetype || !req.file.mimetype.startsWith(allowedPrefix)) {
      return res.status(400).json({ error: 'invalid_file_type' })
    }
    const existing = await query(`SELECT ${column} AS path FROM words WHERE id = $1`, [
      req.params.id,
    ])
    if (existing.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    const objectPath = await uploadObject(req.file.buffer, req.file.mimetype)
    const result = await query(
      `UPDATE words SET ${column} = $2 WHERE id = $1 RETURNING *`,
      [req.params.id, objectPath]
    )
    if (existing.rows[0].path && existing.rows[0].path !== objectPath) {
      await deleteObject(existing.rows[0].path)
    }
    res.json(mapWord(result.rows[0]))
  }

  app.post('/api/admin/words/:id/photo', requireAdmin, upload.single('file'), async (req, res) => {
    try {
      await handleMediaUpload(req, res, 'image_path', 'image/')
    } catch (err) {
      console.error('photo upload failed:', err)
      res.status(500).json({ error: 'upload_failed' })
    }
  })

  app.post('/api/admin/words/:id/audio', requireAdmin, upload.single('file'), async (req, res) => {
    try {
      await handleMediaUpload(req, res, 'audio_path', 'audio/')
    } catch (err) {
      console.error('audio upload failed:', err)
      res.status(500).json({ error: 'upload_failed' })
    }
  })

  app.delete('/api/admin/words/:id/audio', requireAdmin, async (req, res) => {
    try {
      const existing = await query('SELECT audio_path FROM words WHERE id = $1', [req.params.id])
      if (existing.rowCount === 0) return res.status(404).json({ error: 'not_found' })
      await query('UPDATE words SET audio_path = NULL WHERE id = $1', [req.params.id])
      await deleteObject(existing.rows[0].audio_path)
      const result = await query('SELECT * FROM words WHERE id = $1', [req.params.id])
      res.json(mapWord(result.rows[0]))
    } catch (err) {
      console.error('audio delete failed:', err)
      res.status(500).json({ error: 'delete_failed' })
    }
  })
}
