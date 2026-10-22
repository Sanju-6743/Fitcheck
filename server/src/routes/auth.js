import { Router } from 'express'
import { db } from '../db.js'
import { setAuthCookie, clearAuthCookie, readUser, requireAuth, verifyPassword, hashPassword, rateLimit } from '../auth.js'
import { email as validEmail, str, wrap } from '../validate.js'

const router = Router()

router.post(
  '/login',
  rateLimit({ max: 8, keyFn: (req) => `login:${req.ip}` }),
  wrap(async (req, res) => {
    const email = validEmail(req.body?.email)
    const password = str(req.body?.password, { required: true, max: 200 })

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    setAuthCookie(res, user)
    await db.prepare('UPDATE users SET created_at = created_at WHERE id = ?').run(user.id)
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  })
)

router.post('/logout', (req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

router.get(
  '/me',
  wrap(async (req, res) => {
    const payload = readUser(req)
    if (!payload) return res.json({ user: null })
    const user = await db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id)
    res.json({ user: user || null })
  })
)

router.post(
  '/password',
  requireAuth,
  wrap(async (req, res) => {
    const current = str(req.body?.currentPassword, { required: true })
    const next = str(req.body?.newPassword, { required: true, min: 8, max: 200 })
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
    if (!verifyPassword(current, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(next), user.id)
    res.json({ ok: true })
  })
)

export default router
