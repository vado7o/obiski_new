import session from 'express-session'
import connectPg from 'connect-pg-simple'
import { pool } from './db.js'

export function getSession() {
  const sessionTtlSec = 7 * 24 * 60 * 60
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
      maxAge: sessionTtlSec * 1000,
    },
  })
}

export async function setupAuth(app) {
  app.set('trust proxy', 1)
  app.use(getSession())
}
