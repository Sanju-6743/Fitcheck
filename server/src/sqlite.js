import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SQLITE_PRAGMAS, SQLITE_SCHEMA } from './schema.js'

// Serializes writes so an open transaction can never interleave with
// other requests on the single shared DatabaseSync connection.
const createMutex = () => {
  let tail = Promise.resolve()
  return (fn) => {
    const run = tail.then(fn, fn)
    tail = run.then(
      () => {},
      () => {}
    )
    return run
  }
}

export async function createSqliteDb() {
  const { DatabaseSync } = await import('node:sqlite')

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const dataDir = process.env.VERCEL ? '/tmp' : join(__dirname, '..', 'data')
  mkdirSync(dataDir, { recursive: true })

  const sqlite = new DatabaseSync(join(dataDir, 'fitcheck.db'))
  for (const pragma of SQLITE_PRAGMAS) sqlite.exec(pragma)
  sqlite.exec(SQLITE_SCHEMA)

  const lock = createMutex()

  const raw = {
    prepare(sql) {
      const stmt = sqlite.prepare(sql)
      return {
        get: async (...params) => stmt.get(...params),
        all: async (...params) => stmt.all(...params),
        run: async (...params) => {
          const res = stmt.run(...params)
          return { lastInsertRowid: Number(res.lastInsertRowid), changes: Number(res.changes) }
        },
      }
    },
    exec: async (sql) => {
      sqlite.exec(sql)
    },
  }

  const gated = (realm) => ({
    prepare(sql) {
      const stmt = realm.prepare(sql)
      return {
        get: (...params) => lock(() => stmt.get(...params)),
        all: (...params) => lock(() => stmt.all(...params)),
        run: (...params) => lock(() => stmt.run(...params)),
      }
    },
    exec: (sql) => lock(() => realm.exec(sql)),
  })

  return {
    engine: 'sqlite',
    ...gated(raw),
    tx: (fn) => lock(() => fn(raw)),
  }
}
