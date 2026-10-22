import { toPgSql } from '../src/pg.js'

const cases = [
  ["SELECT * FROM products WHERE slug = ? AND active = 1", "SELECT * FROM products WHERE slug = $1 AND active = 1"],
  ["UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?", "UPDATE products SET stock = $1, updated_at = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') WHERE id = $2"],
  ["SELECT date(created_at) AS day FROM payments", "SELECT substr(created_at, 1, 10) AS day FROM payments"],
  ["WHERE created_at >= datetime('now', ?) GROUP BY day", "WHERE created_at >= to_char((now() AT TIME ZONE 'utc') + ($1::text)::interval, 'YYYY-MM-DD HH24:MI:SS') GROUP BY day"],
  ["AND created_at >= datetime('now', '-14 days')", "AND created_at >= to_char((now() AT TIME ZONE 'utc') + ('-14 days'::text)::interval, 'YYYY-MM-DD HH24:MI:SS')"],
  ["(name LIKE ? OR slug LIKE ?)", "(name ILIKE $1 OR slug ILIKE $2)"],
  ["INSERT INTO ticket_replies (ticket_id, author, body) VALUES (?, 'customer', ?)", "INSERT INTO ticket_replies (ticket_id, author, body) VALUES ($1, 'customer', $2)"],
  ["SELECT COUNT(*) AS c FROM orders WHERE payment_status = ?", "SELECT COUNT(*) AS c FROM orders WHERE payment_status = $1"],
  ["SELECT * FROM tickets WHERE status = ? ORDER BY CASE status WHEN 'open' THEN 0 ELSE 2 END, id DESC", "SELECT * FROM tickets WHERE status = $1 ORDER BY CASE status WHEN 'open' THEN 0 ELSE 2 END, id DESC"],
]

let fail = 0
for (const [input, expected] of cases) {
  const out = toPgSql(input)
  const norm = (s) => s.replace(/\s+/g, ' ').trim()
  if (norm(out) !== norm(expected)) {
    console.log('FAIL\n  in :', input, '\n  out:', out, '\n  exp:', expected)
    fail++
  } else {
    console.log('OK  ', norm(out).slice(0, 90))
  }
}
console.log(fail ? `${fail} FAILED` : `toPgSql: ${cases.length}/${cases.length} passed`)
process.exit(fail ? 1 : 0)
