import pg from 'pg'
import { PG_SCHEMA } from './schema.js'

const { Pool, types } = pg

// COUNT/SUM come back as strings in node-pg — normalize to numbers like SQLite did
types.setTypeParser(20, (v) => parseInt(v, 10))
types.setTypeParser(1700, (v) => parseFloat(v))

const CONN_ERROR_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE',
  '57P01', '57P02', '57P03', '08000', '08003', '08006', '08S01',
])

const isConnError = (err) =>
  !!err && (CONN_ERROR_CODES.has(err.code) || /connection (terminated|ended|refused)|timeout exceeded|Client has closed/i.test(err.message || ''))

// Translate SQLite-flavoured SQL used across the routes into Postgres.
export function toPgSql(sql) {
  let s = sql
  // datetime('now', ?) → keep the ? so placeholder numbering still sees it
  s = s.replace(
    /datetime\(\s*'now'\s*,\s*\?\s*\)/g,
    "to_char((now() AT TIME ZONE 'utc') + (?::text)::interval, 'YYYY-MM-DD HH24:MI:SS')"
  )
  // datetime('now', '<literal interval>') → embed the interval literal directly
  s = s.replace(
    /datetime\(\s*'now'\s*,\s*('[^']*')\s*\)/g,
    "to_char((now() AT TIME ZONE 'utc') + ($1::text)::interval, 'YYYY-MM-DD HH24:MI:SS')"
  )
  s = s.replace(/datetime\(\s*'now'\s*\)/g, "to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')")
  s = s.replace(/date\(created_at\)/g, 'substr(created_at, 1, 10)')

  let out = ''
  let inStr = false
  let n = 0
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === "'") {
      inStr = !inStr
      out += ch
      i++
      continue
    }
    if (!inStr) {
      if (ch === '?') {
        n++
        out += '$' + n
        i++
        continue
      }
      const prev = i > 0 ? s[i - 1] : ' '
      if (!/[A-Za-z0-9_]/.test(prev)) {
        const rest = s.slice(i)
        let m = rest.match(/^ILIKE\b/i)
        if (m) {
          out += m[0]
          i += m[0].length
          continue
        }
        m = rest.match(/^LIKE\b/i)
        if (m) {
          out += 'ILIKE'
          i += m[0].length
          continue
        }
      }
    }
    out += ch
    i++
  }
  return out
}

const withReturn = (sql) => (/^\s*INSERT\s/i.test(sql) ? `${sql.trim().replace(/;+$/, '')} RETURNING id` : sql)

export async function createPgDb(url) {
  const pool = new Pool({
    connectionString: url,
    max: 4,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    ssl: /supabase\.(co|in)/i.test(url) || /sslmode=/i.test(url) ? { rejectUnauthorized: false } : undefined,
  })
  pool.on('error', (err) => console.error('Postgres idle client error:', err.message))

  const queryPool = async (sql, params) => {
    const text = toPgSql(sql)
    try {
      return params ? await pool.query(text, params) : await pool.query(text)
    } catch (err) {
      if (isConnError(err)) return params ? await pool.query(text, params) : await pool.query(text)
      throw err
    }
  }

  // idempotent schema — retry a couple of times on cold start
  let schemaErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await pool.query(PG_SCHEMA)
      schemaErr = null
      break
    } catch (err) {
      schemaErr = err
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  if (schemaErr) throw schemaErr

  const bound = (runner) => ({
    prepare(sql) {
      return {
        get: async (...params) => (await runner(sql, params)).rows[0],
        all: async (...params) => (await runner(sql, params)).rows,
        run: async (...params) => {
          const isInsert = /^\s*INSERT\s/i.test(sql)
          const res = await runner(withReturn(sql), params)
          return { lastInsertRowid: isInsert ? Number(res.rows[0]?.id ?? 0) : 0, changes: res.rowCount ?? 0 }
        },
      }
    },
    exec: async (sql) => {
      await runner(sql, null)
    },
  })

  const db = {
    engine: 'postgres',
    ...bound((sql, params) => (params && params.length ? queryPool(sql, params) : queryPool(sql))),
    tx: async (fn) => {
      const client = await pool.connect()
      const run = async (sql, params) => {
        const text = toPgSql(sql)
        return params && params.length ? client.query(text, params) : client.query(text)
      }
      try {
        await client.query('BEGIN')
        await fn(bound(run))
        await client.query('COMMIT')
      } catch (err) {
        try {
          await client.query('ROLLBACK')
        } catch {
          /* connection already gone */
        }
        throw err
      } finally {
        client.release()
      }
    },
  }
  return db
}
