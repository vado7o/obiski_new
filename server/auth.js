export function requireOwner(req, res, next) {
  if (req.session?.isAdmin) return next()
  return res.status(403).json({ error: 'forbidden' })
}

export function registerAuthRoutes(app) {
  app.get('/api/auth/user', (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin })
  })

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {}
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword || !password || password !== adminPassword) {
      return res.status(401).json({ error: 'wrong_password' })
    }
    req.session.isAdmin = true
    res.json({ ok: true })
  })

  app.post('/api/admin/logout', (req, res) => {
    req.session.isAdmin = false
    res.json({ ok: true })
  })
}
