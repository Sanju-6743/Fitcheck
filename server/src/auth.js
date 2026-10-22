import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const SECRET = process.env.JWT_SECRET || 'fitcheck-dev-secret-change-in-production'
const COOKIE = 'fc_token'
const MAX_AGE = 1000 * 60 * 60 * 8

export const hashPassword = (password) => bcrypt.hashSync(password, 12)
export const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash)

export function setAuthCookie(res, user) {
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, {
    expiresIn: '8h',
  })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE, { path: '/' })
}

export function readUser(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return null
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export async function requireAuth(req, res, next) {
  try {
    const payload = readUser(req)
    if (!payload) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    const user = await db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id)
    if (!user) {
      return res.status(401).json({ error: 'Session invalid' })
    }
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

const buckets = new Map()

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 8, keyFn }) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip
    const now = Date.now()
    let bucket = buckets.get(key)
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }
    bucket.count += 1
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' })
    }
    next()
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}, 60_000).unref()
