import { db } from './db.js'
import { hashPassword } from './auth.js'

const userCount = (await db.prepare('SELECT COUNT(*) AS c FROM users').get()).c

if (userCount === 0) {
  await db
    .prepare(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO NOTHING'
    )
    .run('admin@fitcheck.in', 'Sanjay', hashPassword('admin123'), 'admin')
  console.log('Seeded admin → admin@fitcheck.in / admin123')
}

const productCount = (await db.prepare('SELECT COUNT(*) AS c FROM products').get()).c

if (productCount === 0) {
  const products = [
    {
      slug: 'classic-street-shirt',
      name: 'Classic Street Shirt',
      category: 'shirts',
      price: 1000,
      stock: 50,
      description:
        'A clean, versatile street shirt cut from soft cotton twill. Relaxed fit with a crisp collar, dropped shoulders and a curved hem — layers over tees as easily as it stands alone.',
      image: '/img/products/classic-street-shirt.svg',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      featured: 1,
    },
    {
      slug: 'urban-stride-pant',
      name: 'Urban Stride Pant',
      category: 'bottomwear',
      price: 1500,
      stock: 50,
      description:
        'Straight-leg street pant in durable cotton-blend ripstop. Mid-rise waist, side utility pockets and an adjustable hem — built to move from campus to crew meets.',
      image: '/img/products/urban-stride-pant.svg',
      sizes: ['28', '30', '32', '34', '36'],
      featured: 1,
    },
  ]

  const insert = db.prepare(`
    INSERT INTO products (slug, name, description, category, price, compare_at_price, stock, image, sizes, featured, active)
    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 1)
    ON CONFLICT (slug) DO NOTHING
  `)
  for (const p of products) {
    await insert.run(p.slug, p.name, p.description, p.category, p.price, p.stock, p.image, JSON.stringify(p.sizes), p.featured)
  }
  console.log(`Seeded ${products.length} products (shirt ₹1000 · pant ₹1500)`)
}

console.log(`Database ready (${db.engine}) — no dummy orders, tickets or messages.`)
