import { Router } from 'express'
import { db, mapProduct, paymentRef } from '../db.js'
import { requireAuth } from '../auth.js'
import { str, email as validEmail, num, int, bool, wrap } from '../validate.js'

const router = Router()
router.use(requireAuth)

/* ---------------------------------- products --------------------------------- */

const productBody = (body, { partial = false } = {}) => {
  const out = {}
  const req = (key, opts) => (partial ? (body[key] === undefined ? undefined : str(body[key], opts)) : str(body[key], opts))

  const name = req('name', { required: !partial, max: 160 })
  if (name !== undefined) out.name = name
  const description = req('description', { max: 4000 })
  if (description !== undefined) out.description = description
  const category = req('category', { max: 50 })
  if (category !== undefined) out.category = category || 'tees'

  if (body.price !== undefined || !partial) out.price = num(body.price, { required: !partial, min: 0, max: 1_000_000 })
  if (body.compare_at_price !== undefined || !partial) {
    const compare = body.compare_at_price === '' || body.compare_at_price === null ? null : num(body.compare_at_price, { min: 0, max: 1_000_000 })
    out.compare_at_price = compare
  }
  if (body.stock !== undefined || !partial) out.stock = int(body.stock, { min: 0, max: 1_000_000, required: !partial })
  if (body.low_stock_threshold !== undefined || !partial) {
    out.low_stock_threshold = int(body.low_stock_threshold, { min: 0, max: 10_000, fallback: 8 })
  }
  if (body.image !== undefined || !partial) out.image = str(body.image, { max: 500, fallback: '' })
  if (body.gallery !== undefined || !partial) {
    const gallery = Array.isArray(body.gallery) ? body.gallery.map((g) => str(g, { max: 500 })).filter(Boolean) : []
    out.gallery = JSON.stringify(gallery)
  }
  if (body.sizes !== undefined || !partial) {
    const sizes = Array.isArray(body.sizes) ? body.sizes.map((s) => str(s, { max: 12 })).filter(Boolean) : []
    out.sizes = JSON.stringify(sizes.length ? sizes : ['M'])
  }
  if (body.featured !== undefined) out.featured = bool(body.featured) ? 1 : 0
  if (body.active !== undefined) out.active = bool(body.active) ? 1 : 0
  return out
}

router.get(
  '/products',
  wrap(async (req, res) => {
    const search = str(req.query.search, { max: 100 })
    const where = []
    const params = []
    if (search) {
      where.push('(name LIKE ? OR category LIKE ? OR slug LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (req.query.active === 'true') where.push('active = 1')
    if (req.query.active === 'false') where.push('active = 0')
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const products = (await db.prepare(`SELECT * FROM products ${clause} ORDER BY id DESC`).all(...params)).map(mapProduct)
    res.json({ products })
  })
)

router.post(
  '/products',
  wrap(async (req, res) => {
    const data = productBody(req.body)
    const baseSlug = str(req.body?.slug, { max: 160 }) || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    let slug = baseSlug
    let i = 2
    while (await db.prepare('SELECT 1 FROM products WHERE slug = ?').get(slug)) slug = `${baseSlug}-${i++}`
    if (!slug) slug = `product-${Date.now()}`

    const featured = bool(req.body?.featured) ? 1 : 0
    const active = req.body?.active === undefined ? 1 : bool(req.body.active) ? 1 : 0

    const result = await db
      .prepare(
        `INSERT INTO products (slug, name, description, category, price, compare_at_price, stock, low_stock_threshold, image, gallery, sizes, featured, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug, data.name, data.description ?? '', data.category ?? 'tees', data.price,
        data.compare_at_price ?? null, data.stock ?? 0, data.low_stock_threshold ?? 8,
        data.image ?? '', data.gallery ?? '[]', data.sizes ?? '["M"]', featured, active
      )
    res.status(201).json({
      product: mapProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(Number(result.lastInsertRowid))),
    })
  })
)

router.put(
  '/products/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const existing = await db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    const data = productBody(req.body, { partial: true })
    if (Object.keys(data).length) {
      const sets = Object.keys(data).map((k) => `${k} = ?`)
      await db.prepare(`UPDATE products SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(
        ...Object.values(data),
        id
      )
    }
    res.json({ product: mapProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(id)) })
  })
)

router.delete(
  '/products/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const existing = await db.prepare('SELECT name FROM products WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Product not found' })
    await db.prepare('DELETE FROM products WHERE id = ?').run(id)
    res.json({ ok: true, deleted: existing.name })
  })
)

router.patch(
  '/products/:id/stock',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const existing = await db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    let stock
    if (req.body?.stock !== undefined) stock = int(req.body.stock, { min: 0, max: 1_000_000, required: true })
    else if (req.body?.delta !== undefined) stock = Math.max(0, existing.stock + int(req.body.delta, { min: -1_000_000, max: 1_000_000, required: true }))
    else return res.status(400).json({ error: 'Provide stock or delta' })

    await db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?").run(stock, id)
    res.json({ product: mapProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(id)) })
  })
)

/* --------------------------------- discounts --------------------------------- */

const discountBody = (body, { partial = false } = {}) => {
  const out = {}
  if (body.code !== undefined || !partial) out.code = str(body.code, { required: !partial, max: 40 }).toUpperCase()
  if (body.description !== undefined || !partial) out.description = str(body.description, { max: 300, fallback: '' })
  if (body.type !== undefined || !partial) {
    const type = str(body.type, { max: 10, fallback: 'percent' })
    if (!['percent', 'fixed'].includes(type)) throw new Error('Type must be percent or fixed')
    out.type = type
  }
  if (body.value !== undefined || !partial) out.value = num(body.value, { required: !partial, min: 0, max: 1_000_000 })
  if (body.min_order !== undefined || !partial) out.min_order = num(body.min_order, { min: 0, max: 10_000_000, fallback: 0 })
  if (body.max_uses !== undefined || !partial) out.max_uses = int(body.max_uses, { min: 0, max: 1_000_000, fallback: 0 })
  if (body.starts_at !== undefined) out.starts_at = str(body.starts_at, { max: 40 }) || null
  if (body.ends_at !== undefined) out.ends_at = str(body.ends_at, { max: 40 }) || null
  if (body.active !== undefined) out.active = bool(body.active) ? 1 : 0
  return out
}

router.get(
  '/discounts',
  wrap(async (req, res) => {
    res.json({ discounts: await db.prepare('SELECT * FROM discounts ORDER BY id DESC').all() })
  })
)

router.post(
  '/discounts',
  wrap(async (req, res) => {
    const data = discountBody(req.body)
    if (await db.prepare('SELECT 1 FROM discounts WHERE code = ?').get(data.code)) {
      return res.status(409).json({ error: 'A discount with this code already exists' })
    }
    const result = await db
      .prepare(
        'INSERT INTO discounts (code, description, type, value, min_order, max_uses, starts_at, ends_at, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        data.code, data.description ?? '', data.type ?? 'percent', data.value,
        data.min_order ?? 0, data.max_uses ?? 0, data.starts_at ?? null, data.ends_at ?? null,
        data.active === undefined ? 1 : data.active
      )
    res.status(201).json({ discount: await db.prepare('SELECT * FROM discounts WHERE id = ?').get(Number(result.lastInsertRowid)) })
  })
)

router.put(
  '/discounts/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const existing = await db.prepare('SELECT * FROM discounts WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Discount not found' })
    const data = discountBody(req.body, { partial: true })
    if (data.code && (await db.prepare('SELECT 1 FROM discounts WHERE code = ? AND id != ?').get(data.code, id))) {
      return res.status(409).json({ error: 'A discount with this code already exists' })
    }
    if (Object.keys(data).length) {
      const sets = Object.keys(data).map((k) => `${k} = ?`)
      await db.prepare(`UPDATE discounts SET ${sets.join(', ')} WHERE id = ?`).run(...Object.values(data), id)
    }
    res.json({ discount: await db.prepare('SELECT * FROM discounts WHERE id = ?').get(id) })
  })
)

router.delete(
  '/discounts/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    if (!(await db.prepare('SELECT 1 FROM discounts WHERE id = ?').get(id))) return res.status(404).json({ error: 'Discount not found' })
    await db.prepare('DELETE FROM discounts WHERE id = ?').run(id)
    res.json({ ok: true })
  })
)

/* ---------------------------------- orders ----------------------------------- */

router.get(
  '/orders',
  wrap(async (req, res) => {
    const where = []
    const params = []
    if (req.query.payment_status) {
      where.push('payment_status = ?')
      params.push(str(req.query.payment_status, { max: 20 }))
    }
    if (req.query.fulfillment_status) {
      where.push('fulfillment_status = ?')
      params.push(str(req.query.fulfillment_status, { max: 20 }))
    }
    const search = str(req.query.search, { max: 100 })
    if (search) {
      where.push('(order_code LIKE ? OR customer_name LIKE ? OR email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orders = await db.prepare(`SELECT * FROM orders ${clause} ORDER BY id DESC LIMIT 300`).all(...params)
    for (const order of orders) {
      order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    }
    res.json({ orders })
  })
)

router.get(
  '/orders/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json({
      order: {
        ...order,
        items: await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id),
        payments: await db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC').all(id),
      },
    })
  })
)

router.patch(
  '/orders/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const nextPayment = str(req.body?.payment_status, { max: 20 }) || null
    const nextFulfillment = str(req.body?.fulfillment_status, { max: 20 }) || null

    if (nextPayment && nextPayment !== order.payment_status) {
      if (nextPayment === 'paid') {
        const ref = order.payment_ref || paymentRef()
        await db.prepare("UPDATE orders SET payment_status = 'paid', payment_ref = ?, updated_at = datetime('now') WHERE id = ?").run(ref, id)
        await db
          .prepare(
            "INSERT INTO payments (order_id, event, amount, method, status, reference, note) VALUES (?, ?, ?, ?, 'captured', ?, ?)"
          )
          .run(id, order.payment_method === 'cod' ? 'cod_settlement' : 'charge', order.total, order.payment_method, ref, 'Marked paid by admin')
      } else if (nextPayment === 'refunded') {
        if (order.payment_status !== 'paid') return res.status(400).json({ error: 'Only paid orders can be refunded' })
        await db.prepare("UPDATE orders SET payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(id)
        await db
          .prepare(
            "INSERT INTO payments (order_id, event, amount, method, status, note) VALUES (?, 'refund', ?, ?, 'refunded', 'Refunded by admin')"
          )
          .run(id, -order.total, order.payment_method)
      } else if (nextPayment === 'pending') {
        if (order.payment_status !== 'failed') return res.status(400).json({ error: 'Only failed orders can be reset to pending' })
        await db.prepare("UPDATE orders SET payment_status = 'pending', updated_at = datetime('now') WHERE id = ?").run(id)
      } else if (nextPayment === 'cod_pending') {
        await db.prepare("UPDATE orders SET payment_status = 'cod_pending', updated_at = datetime('now') WHERE id = ?").run(id)
      } else if (nextPayment === 'failed') {
        await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(id)
      } else {
        return res.status(400).json({ error: 'Invalid payment status' })
      }
    }

    if (nextFulfillment && nextFulfillment !== order.fulfillment_status) {
      if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(nextFulfillment)) {
        return res.status(400).json({ error: 'Invalid fulfillment status' })
      }
      await db.prepare("UPDATE orders SET fulfillment_status = ?, updated_at = datetime('now') WHERE id = ?").run(nextFulfillment, id)
      if (nextFulfillment === 'cancelled') {
        const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)
        const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
        for (const item of items) if (item.product_id) await restock.run(item.qty, item.product_id)
      }
    }

    const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    res.json({
      order: {
        ...updated,
        items: await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id),
        payments: await db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC').all(id),
      },
    })
  })
)

/* --------------------------------- cash flow --------------------------------- */

const cashflowSQL = (days) => `
  SELECT date(created_at) AS day,
         SUM(CASE WHEN event IN ('charge','cod_settlement') THEN amount ELSE 0 END) AS inflow,
         SUM(CASE WHEN event = 'refund' THEN amount ELSE 0 END) AS outflow,
         COUNT(*) AS events
  FROM payments
  WHERE created_at >= datetime('now', ?)
  GROUP BY day ORDER BY day ASC
`

router.get(
  '/cashflow',
  wrap(async (req, res) => {
    const days = int(req.query.days, { min: 1, max: 365, fallback: 30 })
    const range = `-${days} days`

    const summary = await db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN event IN ('charge','cod_settlement') THEN amount ELSE 0 END), 0) AS inflow,
           COALESCE(SUM(CASE WHEN event = 'refund' THEN ABS(amount) ELSE 0 END), 0) AS refunds,
           COALESCE(SUM(CASE WHEN event = 'charge' THEN amount ELSE 0 END), 0) AS card_upi_sales,
           COALESCE(SUM(CASE WHEN event = 'cod_settlement' THEN amount ELSE 0 END), 0) AS cod_settled,
           COUNT(*) AS events
         FROM payments WHERE created_at >= datetime('now', ?)`
      )
      .get(range)

    const byMethod = await db
      .prepare(
        `SELECT method,
                SUM(CASE WHEN event IN ('charge','cod_settlement') THEN amount ELSE 0 END) AS inflow,
                SUM(CASE WHEN event = 'refund' THEN ABS(amount) ELSE 0 END) AS refunds,
                COUNT(*) AS events
         FROM payments WHERE created_at >= datetime('now', ?) GROUP BY method ORDER BY inflow DESC`
      )
      .all(range)

    const series = await db.prepare(cashflowSQL(range)).all(range)
    const byDay = new Map(series.map((s) => [s.day, s]))
    const fullSeries = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      const row = byDay.get(d)
      fullSeries.push({
        day: d,
        inflow: row?.inflow || 0,
        outflow: Math.abs(row?.outflow || 0),
        net: (row?.inflow || 0) - Math.abs(row?.outflow || 0),
      })
    }

    const ledger = await db
      .prepare(
        `SELECT p.*, o.order_code, o.customer_name
         FROM payments p JOIN orders o ON o.id = p.order_id
         WHERE p.created_at >= datetime('now', ?)
         ORDER BY p.id DESC LIMIT 400`
      )
      .all(range)

    const pendingCod = await db
      .prepare("SELECT COUNT(*) AS c, COALESCE(SUM(total), 0) AS amount FROM orders WHERE payment_status = 'cod_pending'")
      .get()

    res.json({
      days,
      summary: {
        ...summary,
        net: summary.inflow - summary.refunds,
      },
      byMethod,
      series: fullSeries,
      ledger,
      pendingCod,
    })
  })
)

router.get(
  '/cashflow/export',
  wrap(async (req, res) => {
    const rows = await db
      .prepare(
        `SELECT p.created_at, o.order_code, o.customer_name, p.event, p.method, p.amount, p.status, p.reference, p.note
         FROM payments p JOIN orders o ON o.id = p.order_id ORDER BY p.id DESC`
      )
      .all()
    const header = 'date,order_code,customer,event,method,amount,status,reference,note'
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [header, ...rows.map((r) => [r.created_at, r.order_code, r.customer_name, r.event, r.method, r.amount, r.status, r.reference, r.note].map(esc).join(','))].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="fitcheck-cashflow.csv"')
    res.send(csv)
  })
)

/* --------------------------------- dashboard --------------------------------- */

router.get(
  '/stats',
  wrap(async (req, res) => {
    const kpis = await db
      .prepare(
        `SELECT
           (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE event IN ('charge','cod_settlement')) AS revenue,
           (SELECT COALESCE(SUM(ABS(amount)), 0) FROM payments WHERE event = 'refund') AS refunds,
           (SELECT COUNT(*) FROM orders) AS orders,
           (SELECT COUNT(*) FROM orders WHERE payment_status = 'pending') AS pending_payments,
           (SELECT COUNT(*) FROM orders WHERE payment_status = 'cod_pending') AS cod_pending,
           (SELECT COUNT(*) FROM orders WHERE fulfillment_status = 'processing') AS processing,
           (SELECT COUNT(*) FROM products WHERE active = 1) AS active_products,
           (SELECT COUNT(*) FROM products WHERE stock <= low_stock_threshold) AS low_stock,
           (SELECT COUNT(*) FROM tickets WHERE status != 'resolved') AS open_tickets,
           (SELECT COUNT(*) FROM messages WHERE status = 'new') AS new_messages`
      )
      .get()

    const revenueSeries = await db
      .prepare(
        `SELECT date(created_at) AS day, SUM(amount) AS amount
         FROM payments WHERE event IN ('charge','cod_settlement') AND created_at >= datetime('now', '-14 days')
         GROUP BY day ORDER BY day ASC`
      )
      .all()
    const byDay = new Map(revenueSeries.map((r) => [r.day, r.amount]))
    const series = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      series.push({ day: d, amount: byDay.get(d) || 0 })
    }

    const paymentBreakdown = await db
      .prepare('SELECT payment_status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total FROM orders GROUP BY payment_status')
      .all()

    const topProducts = await db
      .prepare(
        `SELECT oi.name, SUM(oi.qty) AS units, SUM(oi.total) AS revenue
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.payment_status IN ('paid','cod_pending')
         GROUP BY oi.name ORDER BY revenue DESC LIMIT 5`
      )
      .all()

    const recentOrders = await db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 8').all()
    const lowStock = await db
      .prepare('SELECT id, name, stock, low_stock_threshold, image FROM products WHERE stock <= low_stock_threshold AND active = 1 ORDER BY stock ASC LIMIT 8')
      .all()

    res.json({ kpis: { ...kpis, net: kpis.revenue - kpis.refunds }, series, paymentBreakdown, topProducts, recentOrders, lowStock })
  })
)

/* ---------------------------------- messages --------------------------------- */

router.get(
  '/messages',
  wrap(async (req, res) => {
    const messages = await db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 200').all()
    res.json({ messages })
  })
)

router.patch(
  '/messages/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const status = str(req.body?.status, { required: true, max: 20 })
    if (!['new', 'read', 'replied'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    if (!(await db.prepare('SELECT 1 FROM messages WHERE id = ?').get(id))) return res.status(404).json({ error: 'Message not found' })
    await db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id)
    res.json({ ok: true })
  })
)

router.delete(
  '/messages/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    await db.prepare('DELETE FROM messages WHERE id = ?').run(id)
    res.json({ ok: true })
  })
)

/* ---------------------------------- tickets ---------------------------------- */

router.get(
  '/tickets',
  wrap(async (req, res) => {
    const where = []
    const params = []
    if (req.query.status) {
      where.push('status = ?')
      params.push(str(req.query.status, { max: 20 }))
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const tickets = await db
      .prepare(`SELECT * FROM tickets ${clause} ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END, id DESC`)
      .all(...params)
    res.json({ tickets })
  })
)

router.get(
  '/tickets/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const ticket = await db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    const replies = await db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY id ASC').all(id)
    res.json({ ticket, replies })
  })
)

router.post(
  '/tickets/:id/replies',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const ticket = await db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    const body = str(req.body?.body, { required: true, min: 2, max: 4000 })
    await db.prepare("INSERT INTO ticket_replies (ticket_id, author, body) VALUES (?, 'staff', ?)").run(id, body)
    const status = str(req.body?.status, { max: 20 })
    const next = ['open', 'pending', 'resolved'].includes(status) ? status : 'pending'
    await db.prepare("UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?").run(next, id)
    res.json({
      ticket: await db.prepare('SELECT * FROM tickets WHERE id = ?').get(id),
      replies: await db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY id ASC').all(id),
    })
  })
)

router.patch(
  '/tickets/:id',
  wrap(async (req, res) => {
    const id = int(req.params.id, { min: 1, required: true })
    const ticket = await db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    const status = str(req.body?.status, { max: 20 })
    const priority = str(req.body?.priority, { max: 10 })
    if (status && !['open', 'pending', 'resolved'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    if (priority && !['low', 'normal', 'high'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' })
    await db.prepare("UPDATE tickets SET status = ?, priority = ?, updated_at = datetime('now') WHERE id = ?").run(
      status || ticket.status,
      priority || ticket.priority,
      id
    )
    res.json({ ticket: await db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) })
  })
)

export default router
