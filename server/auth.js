import { timingSafeEqual } from 'crypto'

function safeEqual(a, b) {
  const ab = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next()
  return res.status(401).json({ error: 'unauthorized' })
}

export function registerAuthRoutes(app) {
  app.get('/api/auth/me', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.isAdmin) })
  })

  app.post('/api/auth/login', (req, res) => {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      return res.status(503).json({ error: 'admin_password_not_configured' })
    }
    const password = req.body && req.body.password
    if (typeof password === 'string' && safeEqual(password, adminPassword)) {
      req.session.isAdmin = true
      return res.json({ authenticated: true })
    }
    return res.status(401).json({ authenticated: false, error: 'invalid_password' })
  })

  app.post('/api/auth/logout', (req, res) => {
    if (req.session) {
      req.session.destroy(() => res.json({ authenticated: false }))
    } else {
      res.json({ authenticated: false })
    }
  })
}
