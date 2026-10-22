export const str = (value, { max = 500, min = 0, required = false, fallback = '' } = {}) => {
  const raw = value === undefined || value === null ? '' : String(value).trim()
  if (!raw) {
    if (required) throw new Error('This field is required')
    return fallback
  }
  if (raw.length < min) throw new Error(`Must be at least ${min} characters`)
  if (raw.length > max) throw new Error(`Must be at most ${max} characters`)
  return raw
}

export const email = (value) => {
  const raw = str(value, { required: true, max: 200 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) throw new Error('Enter a valid email address')
  return raw.toLowerCase()
}

export const num = (value, { min = 0, max = Infinity, fallback = 0, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error('This field is required')
    return fallback
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) throw new Error('Must be a number')
  if (parsed < min) throw new Error(`Must be at least ${min}`)
  if (parsed > max) throw new Error(`Must be at most ${max}`)
  return parsed
}

export const int = (value, opts = {}) => Math.round(num(value, opts))

export const bool = (value) => value === true || value === 1 || value === '1' || value === 'true'

export const pick = (obj, fields) => {
  const out = {}
  for (const field of fields) {
    if (obj[field] !== undefined) out[field] = obj[field]
  }
  return out
}

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
