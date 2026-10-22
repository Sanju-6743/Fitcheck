import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import './db.js'
import './seed.js'
import { engine } from './db.js'
import authRoutes from './routes/auth.js'
import shopRoutes from './routes/shop.js'
import contactRoutes from './routes/contact.js'
import adminRoutes from './routes/admin.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const VERCEL_ORIGIN = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed =
        !origin ||
        origin === CLIENT_ORIGIN ||
        origin === 'http://127.0.0.1:5173' ||
        (!!VERCEL_ORIGIN && origin === VERCEL_ORIGIN) ||
        (!!process.env.VERCEL && origin.endsWith('.vercel.app'))
      cb(null, allowed)
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'fitcheck-api', db: engine, time: new Date().toISOString() }))
app.use('/api/auth', authRoutes)
app.use('/api', shopRoutes)
app.use('/api', contactRoutes)
app.use('/api/admin', adminRoutes)

const clientDist = join(__dirname, '..', '..', 'client', 'dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1y', index: false }))
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(join(clientDist, 'index.html'))
  })
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err, req, res, next) => {
  const message = err?.message || 'Something went wrong'
  const known = err?.status || (/required|valid|enter|must|provide|unsupported|incorrect/i.test(message) ? 400 : 500)
  if (known >= 500) console.error(err)
  res.status(known).json({ error: message })
})

export default app
