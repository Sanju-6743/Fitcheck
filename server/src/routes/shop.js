import { Router } from 'express'
import { db, mapProduct, newCode, paymentRef } from '../db.js'
import { str, email as validEmail, int, wrap } from '../validate.js'

const router = Router()

const SHIPPING_FLAT = 99
const FREE_SHIPPING_OVER = 1999

const orderWithItems = async (order) => {
  if (!order) return null
  const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
  const payments = await db
    .prepare('SELECT id, event, amount, method, status, reference, note, created_at FROM payments WHERE order_id = ? ORDER BY created_at DESC, id DESC')
    .all(order.id)
  return { ...order, items, payments }
}

router.get(
  '/products',
  wrap(async (req, res) => {
    const search = str(req.query.search, { max: 100 })
    const category = str(req.query.category, { max: 50 })
    const sort = str(req.query.sort, { max: 30, fallback: 'newest' })
    const featured = req.query.featured === 'true'
    const limit = int(req.query.limit, { min: 1, max: 60, fallback: 60 })
    const page = int(req.query.page, { min: 1, fallback: 1 })

    const where = ['active = 1']
    const params = []
    if (search) {
      where.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (category) {
      where.push('category = ?')
      params.push(category)
    }
    if (featured) where.push('featured = 1')

    const orderBy = {
      newest: 'id DESC',
      'price-asc': 'price ASC',
      'price-desc': 'price DESC',
      name: 'name ASC',
    }[sort] || 'id DESC'

    const clause = `WHERE ${where.join(' AND ')}`
    const total = (await db.prepare(`SELECT COUNT(*) AS c FROM products ${clause}`).get(...params)).c
    const rows = await db
      .prepare(`SELECT * FROM products ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit)

    res.json({
      products: rows.map(mapProduct),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      categories: (await db.prepare('SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category').all()).map(
        (r) => r.category
      ),
    })
  })
)

router.get(
  '/products/:slug',
  wrap(async (req, res) => {
    const row = await db
      .prepare('SELECT * FROM products WHERE slug = ? AND active = 1')
      .get(str(req.params.slug, { required: true, max: 200 }))
    if (!row) return res.status(404).json({ error: 'Product not found' })
    const related = (
      await db.prepare('SELECT * FROM products WHERE category = ? AND id != ? AND active = 1 LIMIT 4').all(row.category, row.id)
    ).map(mapProduct)
    res.json({ product: mapProduct(row), related })
  })
)

router.post(
  '/discounts/validate',
  wrap(async (req, res) => {
    const code = str(req.body?.code, { required: true, max: 40 }).toUpperCase()
    const subtotal = Number(req.body?.subtotal) || 0

    const discount = await db.prepare('SELECT * FROM discounts WHERE code = ?').get(code)
    if (!discount || !discount.active) return res.status(404).json({ error: 'Invalid promo code' })

    const now = new Date().toISOString()
    if (discount.starts_at && now < discount.starts_at) return res.status(400).json({ error: 'This code is not active yet' })
    if (discount.ends_at && now > discount.ends_at) return res.status(400).json({ error: 'This code has expired' })
    if (discount.max_uses > 0 && discount.used_count >= discount.max_uses) {
      return res.status(400).json({ error: 'This code has reached its usage limit' })
    }
    if (subtotal < discount.min_order) {
      return res.status(400).json({ error: `Minimum order of ₹${discount.min_order.toLocaleString('en-IN')} required` })
    }

    const amount =
      discount.type === 'percent'
        ? Math.min(subtotal, (subtotal * discount.value) / 100)
        : Math.min(subtotal, discount.value)

    res.json({
      discount: {
        code: discount.code,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        amount: Math.round(amount * 100) / 100,
      },
    })
  })
)

router.post(
  '/orders',
  wrap(async (req, res) => {
    const name = str(req.body?.customer_name, { required: true, max: 120 })
    const email = validEmail(req.body?.email)
    const phone = str(req.body?.phone, { required: true, max: 20, min: 8 })
    const address = str(req.body?.address, { required: true, max: 300 })
    const city = str(req.body?.city, { required: true, max: 100 })
    const state = str(req.body?.state, { required: true, max: 100 })
    const pincode = str(req.body?.pincode, { required: true, max: 10, min: 4 })
    const paymentMethod = str(req.body?.payment_method, { required: true, max: 10 }).toLowerCase()
    const discountCode = str(req.body?.discount_code, { max: 40 }).toUpperCase() || null

    if (!['upi', 'card', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Unsupported payment method' })
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'Your cart is empty' })

    const lines = []
    let subtotal = 0

    for (const item of items) {
      const productId = int(item?.product_id, { min: 1, required: true })
      const qty = int(item?.qty, { min: 1, max: 20, required: true })
      const size = str(item?.size, { max: 10 }) || null
      const product = await db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId)
      if (!product) return res.status(400).json({ error: `Product #${productId} is unavailable` })
      if (product.stock < qty) {
        return res.status(409).json({ error: `Only ${product.stock} left in stock for ${product.name}` })
      }
      const total = product.price * qty
      subtotal += total
      lines.push({ product, qty, size, total })
    }

    let discountAmount = 0
    let appliedCode = null
    if (discountCode) {
      const discount = await db.prepare('SELECT * FROM discounts WHERE code = ? AND active = 1').get(discountCode)
      const now = new Date().toISOString()
      if (
        discount &&
        (!discount.starts_at || now >= discount.starts_at) &&
        (!discount.ends_at || now <= discount.ends_at) &&
        (discount.max_uses === 0 || discount.used_count < discount.max_uses) &&
        subtotal >= discount.min_order
      ) {
        discountAmount =
          discount.type === 'percent'
            ? (subtotal * discount.value) / 100
            : discount.value
        discountAmount = Math.min(subtotal, Math.round(discountAmount * 100) / 100)
        appliedCode = discount.code
      } else {
        return res.status(400).json({ error: 'Promo code is no longer valid' })
      }
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const shipping = afterDiscount >= FREE_SHIPPING_OVER || afterDiscount === 0 ? 0 : SHIPPING_FLAT
    const total = Math.round((afterDiscount + shipping) * 100) / 100

    const orderCode = newCode('FC')
    const paymentStatus = paymentMethod === 'cod' ? 'cod_pending' : 'pending'

    let orderId
    await db.tx(async (tx) => {
      const result = await tx
        .prepare(
          `INSERT INTO orders (
            order_code, customer_name, email, phone, address, city, state, pincode,
            subtotal, discount_amount, discount_code, shipping, total,
            payment_method, payment_status, fulfillment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`
        )
        .run(
          orderCode, name, email, phone, address, city, state, pincode,
          subtotal, discountAmount, appliedCode, shipping, total, paymentMethod, paymentStatus
        )
      orderId = Number(result.lastInsertRowid)
      const insertItem = tx.prepare(
        'INSERT INTO order_items (order_id, product_id, name, price, size, qty, total) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      const decStock = tx.prepare("UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?")
      for (const line of lines) {
        await insertItem.run(orderId, line.product.id, line.product.name, line.product.price, line.size, line.qty, line.total)
        await decStock.run(line.qty, line.product.id)
      }
      if (appliedCode) await tx.prepare('UPDATE discounts SET used_count = used_count + 1 WHERE code = ?').run(appliedCode)
    })

    res.status(201).json({ order: await orderWithItems(await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)) })
  })
)

router.post(
  '/orders/:code/simulate',
  wrap(async (req, res) => {
    const code = str(req.params.code, { required: true, max: 40 })
    const outcome = str(req.body?.outcome, { required: true, max: 10 })
    if (!['success', 'fail'].includes(outcome)) {
      return res.status(400).json({ error: 'Invalid outcome' })
    }

    const order = await db.prepare('SELECT * FROM orders WHERE order_code = ?').get(code)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.payment_method === 'cod') return res.status(400).json({ error: 'COD orders are paid on delivery' })
    if (order.payment_status !== 'pending') return res.status(400).json({ error: 'This order was already processed' })

    if (outcome === 'success') {
      const ref = paymentRef()
      await db
        .prepare("UPDATE orders SET payment_status = 'paid', payment_ref = ?, updated_at = datetime('now') WHERE id = ?")
        .run(ref, order.id)
      await db
        .prepare(
          "INSERT INTO payments (order_id, event, amount, method, status, reference, note) VALUES (?, 'charge', ?, ?, 'captured', ?, ?)"
        )
        .run(order.id, order.total, order.payment_method, ref, 'Simulated gateway capture')
      return res.json({ ok: true, payment_status: 'paid', payment_ref: ref })
    }

    await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(order.id)
    await db
      .prepare(
        "INSERT INTO payments (order_id, event, amount, method, status, note) VALUES (?, 'charge_failed', ?, ?, 'failed', 'Simulated gateway decline')"
      )
      .run(order.id, order.total, order.payment_method)
    res.json({ ok: true, payment_status: 'failed' })
  })
)

router.get(
  '/orders/track/:code',
  wrap(async (req, res) => {
    const code = str(req.params.code, { required: true, max: 40 }).toUpperCase()
    const email = str(req.query.email, { max: 200 }).toLowerCase()
    const order = await db.prepare('SELECT * FROM orders WHERE order_code = ?').get(code)
    if (!order || (email && order.email !== email)) {
      return res.status(404).json({ error: 'No order found with that order ID' })
    }
    res.json({ order: await orderWithItems(order) })
  })
)

export default router
export { orderWithItems }
