import express from 'express'
import session from 'express-session'
import { createServer as createHttpServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerRoutes } from './routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT) || 5000

const app = express()
const httpServer = createHttpServer(app)

app.set('trust proxy', 1)
app.use(express.json())
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'obiski-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
)

registerRoutes(app)

async function start() {
  if (isProd) {
    const distPath = path.resolve(__dirname, '..', 'dist')
    app.use(express.static(distPath))
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next()
      if (req.path.startsWith('/api') || req.path.startsWith('/objects')) return next()
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    const { createServer } = await import('vite')
    const vite = await createServer({
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server: httpServer } },
    })
    app.use(vite.middlewares)
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Obiski server listening on port ${port} (${isProd ? 'production' : 'development'})`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
