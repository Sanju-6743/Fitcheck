const base = 'http://localhost:4000'
let failures = 0
const check = (name, ok, extra = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

async function req(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const setCookies = res.headers.getSetCookie?.() || []
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data, setCookies, cookie: setCookies.map((c) => c.split(';')[0]).join('; ') }
}

// ---------- Storefront seed state ----------
const home = await fetch(base + '/')
check('SPA served', home.ok && (await home.text()).includes('root'))

const products = await req('/api/products?limit=50')
check('Exactly 2 products seeded', products.status === 200 && products.data.total === 2, `total ${products.data.total}`)
const shirt = products.data.products.find((p) => p.slug === 'classic-street-shirt')
const pant = products.data.products.find((p) => p.slug === 'urban-stride-pant')
check('Shirt ₹1000', shirt?.price === 1000)
check('Pant ₹1500', pant?.price === 1500)

// ---------- Admin: everything starts at zero ----------
const login = await req('/api/auth/login', { method: 'POST', body: { email: 'admin@fitcheck.in', password: 'admin123' } })
check('Admin login', login.status === 200)
const cookie = login.cookie
const stats = await req('/api/admin/stats', { cookie })
check('Zero orders', stats.data.kpis.orders === 0, `orders ${stats.data.kpis.orders}`)
check('Zero revenue', stats.data.kpis.revenue === 0, `revenue ${stats.data.kpis.revenue}`)
check('Zero tickets', stats.data.kpis.open_tickets === 0)
check('Zero messages', stats.data.kpis.new_messages === 0)
const discounts = await req('/api/admin/discounts', { cookie })
check('Zero discount codes', discounts.data.discounts.length === 0)
const orderList = await req('/api/admin/orders', { cookie })
check('Empty order list', orderList.data.orders.length === 0)
const cash = await req('/api/admin/cashflow', { cookie })
check('Zero cashflow', cash.data.summary.inflow === 0 && cash.data.summary.events === 0)

// ---------- Admin creates a real discount for promo test ----------
const disc = await req('/api/admin/discounts', { method: 'POST', cookie, body: { code: 'WELCOME100', type: 'fixed', value: 100, min_order: 1000, max_uses: 0, description: '₹100 off above ₹1000' } })
check('Admin creates discount', disc.status === 201)
const badPromo = await req('/api/discounts/validate', { method: 'POST', body: { code: 'BOGUS', subtotal: 2000 } })
check('Invalid promo rejected', badPromo.status === 404)
const goodPromo = await req('/api/discounts/validate', { method: 'POST', body: { code: 'WELCOME100', subtotal: 2500 } })
check('Valid promo applies ₹100', goodPromo.data.discount?.amount === 100)

// ---------- THE USER JOURNEY: cart shirt+pant → COD checkout ----------
const items = [
  { product_id: shirt.id, qty: 1, size: 'M' },
  { product_id: pant.id, qty: 1, size: '32' },
]
const subtotal = 1000 + 1500 // 2500 → free shipping (>= 1999), minus 100 promo = 2400
const order = await req('/api/orders', {
  method: 'POST',
  body: {
    customer_name: 'Sanjay',
    email: 'sanjaymuthakana1@gmail.com',
    phone: '8790271257',
    address: '402, Veera Desai Road, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    payment_method: 'cod',
    discount_code: 'WELCOME100',
    items,
  },
})
check('COD order placed (shirt+pant)', order.status === 201, order.data.order?.order_code)
check('Order total = ₹2400', order.data.order?.total === 2400, `total ${order.data.order?.total}`)
check('COD → cod_pending', order.data.order?.payment_status === 'cod_pending')
const code = order.data.order.order_code

const tracked = await req(`/api/orders/track/${code}?email=sanjaymuthakana1@gmail.com`)
check('Order trackable with email', tracked.status === 200 && tracked.data.order.items.length === 2)
check('Track shows both items', tracked.data.order.items.some((i) => i.name.includes('Shirt')) && tracked.data.order.items.some((i) => i.name.includes('Pant')))

const shirtAfter = await req('/api/products/classic-street-shirt')
const pantAfter = await req('/api/products/urban-stride-pant')
check('Shirt stock 50→49', shirtAfter.data.product.stock === 49)
check('Pant stock 50→49', pantAfter.data.product.stock === 49)

// COD blocked from gateway sim
const codSim = await req(`/api/orders/${code}/simulate`, { method: 'POST', body: { outcome: 'success' } })
check('COD blocks gateway simulate', codSim.status === 400)

// Admin records COD collected → cashflow
const adminOrder = await req(`/api/admin/orders?search=${code}`, { cookie })
const oid = adminOrder.data.orders[0].id
const settle = await req(`/api/admin/orders/${oid}`, { method: 'PATCH', cookie, body: { payment_status: 'paid' } })
check('COD marked paid by admin', settle.data.order.payment_status === 'paid')
const cash2 = await req('/api/admin/cashflow', { cookie })
check('Cashflow now shows ₹2400 COD inflow', cash2.data.summary.inflow === 2400, `inflow ${cash2.data.summary.inflow}`)

const stats2 = await req('/api/admin/stats', { cookie })
check('Dashboard shows 1 order', stats2.data.kpis.orders === 1)
check('Dashboard COD pending updated', stats2.data.kpis.cod_pending === 0)

// ---------- Second COD order stays cod_pending (pending collection) ----------
const order2 = await req('/api/orders', {
  method: 'POST',
  body: {
    customer_name: 'Test User', email: 'test@user.in', phone: '9000000000',
    address: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
    payment_method: 'cod', items: [{ product_id: shirt.id, qty: 1, size: 'L' }],
  },
})
check('Second COD order ₹1000 (no free ship? under 1999 → +99)', order2.data.order?.total === 1099, `total ${order2.data.order?.total}`)
const stats3 = await req('/api/admin/stats', { cookie })
check('COD pending count = 1', stats3.data.kpis.cod_pending === 1)

// ---------- Pincode + address helper APIs reachable ----------
const pin = await fetch('https://api.postalpincode.in/pincode/400053').then((r) => r.json()).catch(() => null)
check('Pincode API live (city/state)', !!pin?.[0]?.PostOffice?.[0]?.District, pin?.[0]?.PostOffice?.[0]?.State)
const nom = await fetch('https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=Andheri+West+Mumbai', { headers: { 'User-Agent': 'FitcheckTest/1.0' } }).then((r) => r.json()).catch(() => null)
check('Address suggestions API live', Array.isArray(nom) && nom.length > 0)

// ---------- Contact info in UI bundle ----------
const html = await fetch(base + '/').then((r) => r.text())
check('SPA loads', html.includes('root'))

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
