import { Router } from 'express'
import { db, newCode } from '../db.js'
import { str, email as validEmail, wrap } from '../validate.js'

const router = Router()

router.post(
  '/messages',
  wrap(async (req, res) => {
    const name = str(req.body?.name, { required: true, max: 120 })
    const email = validEmail(req.body?.email)
    const subject = str(req.body?.subject, { required: true, max: 200 })
    const message = str(req.body?.message, { required: true, min: 10, max: 4000 })
    const result = await db
      .prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)')
      .run(name, email, subject, message)
    res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) })
  })
)

const CATEGORIES = ['order', 'returns', 'payments', 'product', 'partnership', 'general']

router.post(
  '/tickets',
  wrap(async (req, res) => {
    const name = str(req.body?.name, { required: true, max: 120 })
    const email = validEmail(req.body?.email)
    const phone = str(req.body?.phone, { max: 20 })
    const category = str(req.body?.category, { max: 30, fallback: 'general' })
    const subject = str(req.body?.subject, { required: true, max: 200 })
    const message = str(req.body?.message, { required: true, min: 10, max: 4000 })

    const safeCategory = CATEGORIES.includes(category) ? category : 'general'
    const ticketCode = newCode('TK')
    const result = await db
      .prepare(
        'INSERT INTO tickets (ticket_code, name, email, phone, category, subject, message) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(ticketCode, name, email, phone || null, safeCategory, subject, message)

    await db.prepare("INSERT INTO ticket_replies (ticket_id, author, body) VALUES (?, 'customer', ?)").run(
      Number(result.lastInsertRowid),
      message
    )
    res.status(201).json({ ok: true, ticket_code: ticketCode })
  })
)

router.get(
  '/tickets/:code',
  wrap(async (req, res) => {
    const code = str(req.params.code, { required: true, max: 40 }).toUpperCase()
    const ticket = await db.prepare('SELECT * FROM tickets WHERE ticket_code = ?').get(code)
    if (!ticket) return res.status(404).json({ error: 'No ticket found with that code' })
    const replies = await db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY id ASC').all(ticket.id)
    res.json({ ticket, replies })
  })
)

export default router
