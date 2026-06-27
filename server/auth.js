import { isAuthenticated } from './replitAuth.js'

const OWNER_EMAILS = (process.env.OWNER_EMAILS || 'pvb0700@rambler.ru')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function userEmail(req) {
  return (req.user?.claims?.email || '').toLowerCase()
}

export function isOwner(req) {
  return !!(req.isAuthenticated?.() && OWNER_EMAILS.includes(userEmail(req)))
}

// Allow access only to the owner (identified by email). Ensures the session is
// authenticated (and refreshed) first, then checks the owner email.
export function requireOwner(req, res, next) {
  isAuthenticated(req, res, () => {
    if (isOwner(req)) return next()
    return res.status(403).json({ error: 'forbidden' })
  })
}

export function registerAuthRoutes(app) {
  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated?.() || !req.user?.claims) {
      return res.json({ authenticated: false, user: null, isOwner: false })
    }
    const c = req.user.claims
    res.json({
      authenticated: true,
      user: {
        id: c.sub,
        email: c.email || null,
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        profileImageUrl: c.profile_image_url || null,
      },
      isOwner: isOwner(req),
    })
  })
}
