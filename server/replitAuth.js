import * as client from 'openid-client'
import { Strategy } from 'openid-client/passport'
import passport from 'passport'
import session from 'express-session'
import memoize from 'memoizee'
import connectPg from 'connect-pg-simple'
import { pool, query } from './db.js'

if (!process.env.REPLIT_DOMAINS) {
  throw new Error('Environment variable REPLIT_DOMAINS not provided')
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID,
    )
  },
  { maxAge: 3600 * 1000 },
)

export function getSession() {
  const sessionTtlSec = 7 * 24 * 60 * 60 // connect-pg-simple ttl is in seconds
  const isProd = process.env.NODE_ENV === 'production'
  const PgStore = connectPg(session)
  const sessionStore = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtlSec,
    tableName: 'sessions',
  })
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: sessionTtlSec * 1000, // express-session cookie maxAge is in ms
    },
  })
}

function updateUserSession(user, tokens) {
  user.claims = tokens.claims()
  user.access_token = tokens.access_token
  user.refresh_token = tokens.refresh_token
  user.expires_at = user.claims?.exp
}

async function upsertUser(claims) {
  const id = claims.sub
  await query(
    `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       profile_image_url = EXCLUDED.profile_image_url,
       updated_at = NOW()`,
    [
      id,
      claims.email ?? null,
      claims.first_name ?? null,
      claims.last_name ?? null,
      claims.profile_image_url ?? null,
    ],
  )
  // Create the user's personal settings "folder" if it doesn't exist yet.
  await query(
    `INSERT INTO user_settings (user_id, data)
     VALUES ($1, '{}'::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    [id],
  )
}

export async function setupAuth(app) {
  app.set('trust proxy', 1)
  app.use(getSession())
  app.use(passport.initialize())
  app.use(passport.session())

  const config = await getOidcConfig()

  const verify = async (tokens, verified) => {
    const user = {}
    updateUserSession(user, tokens)
    await upsertUser(tokens.claims())
    verified(null, user)
  }

  for (const domain of process.env.REPLIT_DOMAINS.split(',')) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: 'openid email profile offline_access',
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    )
    passport.use(strategy)
  }

  passport.serializeUser((user, cb) => cb(null, user))
  passport.deserializeUser((user, cb) => cb(null, user))

  app.get('/api/login', (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: 'login consent',
      scope: ['openid', 'email', 'profile', 'offline_access'],
    })(req, res, next)
  })

  app.get('/api/callback', (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: '/',
      failureRedirect: '/api/login',
    })(req, res, next)
  })

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href,
      )
    })
  })
}

export const isAuthenticated = async (req, res, next) => {
  const user = req.user

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const now = Math.floor(Date.now() / 1000)
  if (now <= user.expires_at) {
    return next()
  }

  const refreshToken = user.refresh_token
  if (!refreshToken) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const config = await getOidcConfig()
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken)
    updateUserSession(user, tokenResponse)
    return next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}
