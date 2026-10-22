import { randomBytes } from 'node:crypto'

const PG_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || ''

let db

if (PG_URL) {
  const { createPgDb } = await import('./pg.js')
  db = await createPgDb(PG_URL)
} else {
  if (process.env.VERCEL) {
    console.warn(
      '⚠ DATABASE_URL is not set — using ephemeral /tmp SQLite. Data will reset on cold starts. Add DATABASE_URL (Supabase) in Vercel project settings.'
    )
  }
  const { createSqliteDb } = await import('./sqlite.js')
  db = await createSqliteDb()
}

export { db }
export const engine = db.engine

export function newCode(prefix = 'FC') {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`
}

export function paymentRef() {
  return `pay_${randomBytes(8).toString('hex')}`
}

export const parseJSON = (value, fallback) => {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export const mapProduct = (row) => ({
  ...row,
  featured: !!row.featured,
  active: !!row.active,
  sizes: parseJSON(row.sizes, []),
  gallery: parseJSON(row.gallery, []),
})
