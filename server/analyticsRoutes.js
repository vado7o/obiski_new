import { query } from './db.js'
import { requireOwner } from './auth.js'

export function registerAnalyticsRoutes(app) {
  app.post('/api/analytics/visit', async (req, res) => {
    try {
      const { anonId, lang, device } = req.body || {}
      if (!anonId || typeof anonId !== 'string' || anonId.length > 64) {
        return res.status(400).json({ error: 'invalid' })
      }
      const userId = req.user?.claims?.sub || null
      await query(
        `INSERT INTO app_visits (anon_id, user_id, lang, device) VALUES ($1, $2, $3, $4)`,
        [anonId.slice(0, 64), userId, lang || null, device || null]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/analytics/visit failed:', err)
      res.status(500).json({ error: 'failed' })
    }
  })

  app.post('/api/analytics/round', async (req, res) => {
    try {
      const { anonId, themes, difficulty, cardsTotal, cardsCorrect, startedAt } = req.body || {}
      if (!anonId || typeof anonId !== 'string' || anonId.length > 64) {
        return res.status(400).json({ error: 'invalid' })
      }
      const userId = req.user?.claims?.sub || null
      await query(
        `INSERT INTO game_rounds (anon_id, user_id, themes, difficulty, cards_total, cards_correct, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          anonId.slice(0, 64),
          userId,
          Array.isArray(themes) ? themes : [],
          typeof difficulty === 'number' ? difficulty : null,
          typeof cardsTotal === 'number' ? cardsTotal : null,
          typeof cardsCorrect === 'number' ? cardsCorrect : null,
          startedAt ? new Date(startedAt) : null,
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
      const [overview, visitsByDay, topThemes, recentUsers] = await Promise.all([
        query(`
          SELECT
            (SELECT COUNT(DISTINCT anon_id) FROM app_visits)::int AS unique_visitors,
            (SELECT COUNT(*)            FROM users)::int AS registered_users,
            (SELECT COUNT(*)            FROM game_rounds)::int AS total_rounds,
            (SELECT COUNT(*)            FROM game_rounds
              WHERE ended_at >= NOW() - INTERVAL '1 day')::int AS rounds_today,
            (SELECT COUNT(DISTINCT anon_id) FROM app_visits
              WHERE visited_at >= NOW() - INTERVAL '1 day')::int AS visitors_today
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
          SELECT unnest(themes) AS theme_id, COUNT(*)::int AS plays
          FROM game_rounds
          GROUP BY theme_id
          ORDER BY plays DESC
          LIMIT 10
        `),
        query(`
          SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
            COUNT(DISTINCT v.id)::int AS visit_count,
            MAX(v.visited_at)        AS last_seen,
            COUNT(DISTINCT r.id)::int AS rounds_count
          FROM users u
          LEFT JOIN app_visits  v ON v.user_id = u.id
          LEFT JOIN game_rounds r ON r.user_id = u.id
          GROUP BY u.id
          ORDER BY last_seen DESC NULLS LAST
          LIMIT 100
        `),
      ])

      res.json({
        overview: overview.rows[0],
        visitsByDay: visitsByDay.rows,
        topThemes: topThemes.rows,
        recentUsers: recentUsers.rows,
      })
    } catch (err) {
      console.error('GET /api/admin/stats failed:', err)
      res.status(500).json({ error: 'failed' })
    }
  })
}
