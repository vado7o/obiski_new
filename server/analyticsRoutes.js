import { query } from './db.js'
import { requireOwner } from './auth.js'

export function registerAnalyticsRoutes(app) {
  // Вызывается при старте игры (не при открытии приложения)
  app.post('/api/analytics/visit', async (req, res) => {
    try {
      const { anonId, device } = req.body || {}
      if (!anonId || typeof anonId !== 'string' || anonId.length > 64) {
        return res.status(400).json({ error: 'invalid' })
      }
      const userId = req.user?.claims?.sub || null
      await query(
        `INSERT INTO app_visits (anon_id, user_id, device) VALUES ($1, $2, $3)`,
        [anonId.slice(0, 64), userId, device || null]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/analytics/visit failed:', err)
      res.status(500).json({ error: 'failed' })
    }
  })

  app.post('/api/analytics/about', async (req, res) => {
    try {
      const { anonId, device } = req.body || {}
      if (!anonId || typeof anonId !== 'string' || anonId.length > 64) {
        return res.status(400).json({ error: 'invalid' })
      }
      await query(
        `INSERT INTO about_views (anon_id, device) VALUES ($1, $2)`,
        [anonId.slice(0, 64), device || null]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/analytics/about failed:', err)
      res.status(500).json({ error: 'failed' })
    }
  })

  app.post('/api/analytics/round', async (req, res) => {
    try {
      const { anonId, themes, difficulty, device } = req.body || {}
      if (!anonId || typeof anonId !== 'string' || anonId.length > 64) {
        return res.status(400).json({ error: 'invalid' })
      }
      const userId = req.user?.claims?.sub || null
      await query(
        `INSERT INTO game_rounds (anon_id, user_id, themes, difficulty, device)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          anonId.slice(0, 64),
          userId,
          Array.isArray(themes) ? themes : [],
          typeof difficulty === 'number' ? difficulty : null,
          device || null,
        ]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/analytics/round failed:', err)
      res.status(500).json({ error: 'failed' })
    }
  })

  app.get('/api/admin/stats', requireOwner, async (req, res) => {
    try {
      const [overview, visitsByDay, topThemes, deviceBreakdown, difficultyBreakdown, recentUsers] = await Promise.all([
        query(`
          SELECT
            (SELECT COUNT(DISTINCT anon_id) FROM app_visits)::int              AS unique_visitors,
            (SELECT COUNT(*)               FROM game_rounds)::int              AS total_rounds,
            (SELECT COUNT(*)               FROM game_rounds
              WHERE ended_at >= NOW() - INTERVAL '1 day')::int                AS rounds_today,
            (SELECT COUNT(DISTINCT anon_id) FROM app_visits
              WHERE visited_at >= NOW() - INTERVAL '1 day')::int              AS visitors_today,
            (SELECT COUNT(DISTINCT anon_id) FROM about_views)::int            AS about_unique_viewers
        `),
        query(`
          SELECT DATE(visited_at AT TIME ZONE 'UTC') AS day,
                 COUNT(DISTINCT anon_id)::int AS count
          FROM app_visits
          WHERE visited_at >= NOW() - INTERVAL '30 days'
          GROUP BY 1
          ORDER BY 1
        `),
        query(`
          SELECT gr.theme_id, COALESCE(t.name, gr.theme_id) AS theme_name, gr.plays
          FROM (
            SELECT unnest(themes) AS theme_id, COUNT(*)::int AS plays
            FROM game_rounds
            GROUP BY theme_id
          ) gr
          LEFT JOIN themes t ON t.id = gr.theme_id
          ORDER BY gr.plays DESC
          LIMIT 10
        `),
        query(`
          SELECT COALESCE(device, 'unknown') AS device, COUNT(*)::int AS count
          FROM game_rounds
          GROUP BY device
          ORDER BY count DESC
        `),
        query(`
          SELECT difficulty, COUNT(*)::int AS count
          FROM game_rounds
          WHERE difficulty IS NOT NULL
          GROUP BY difficulty
          ORDER BY difficulty
        `),
        query(`
          SELECT
            v.anon_id,
            COUNT(DISTINCT v.id)::int  AS visit_count,
            MAX(v.visited_at)          AS last_seen,
            COUNT(DISTINCT r.id)::int  AS rounds_count,
            (SELECT r2.device FROM game_rounds r2
               WHERE r2.anon_id = v.anon_id AND r2.device IS NOT NULL
               ORDER BY r2.ended_at DESC LIMIT 1) AS device
          FROM app_visits v
          LEFT JOIN game_rounds r ON r.anon_id = v.anon_id
          GROUP BY v.anon_id
          ORDER BY last_seen DESC NULLS LAST
          LIMIT 100
        `),
      ])

      res.json({
        overview: overview.rows[0],
        visitsByDay: visitsByDay.rows,
        topThemes: topThemes.rows,
        deviceBreakdown: deviceBreakdown.rows,
        difficultyBreakdown: difficultyBreakdown.rows,
        recentUsers: recentUsers.rows,
      })
    } catch (err) {
      console.error('GET /api/admin/stats failed:', err)
      res.status(500).json({ error: 'failed' })
    }
  })
}
