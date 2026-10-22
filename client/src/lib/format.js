export const inr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(Number(value) || 0)

export const shortInr = (value) => {
  const n = Number(value) || 0
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

export const formatDate = (value, opts = {}) =>
  new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z')).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  })

export const formatDateTime = (value) =>
  new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z')).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

export const timeAgo = (value) => {
  const then = new Date(String(value).replace(' ', 'T') + 'Z').getTime()
  const diff = Math.max(0, Date.now() - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const PAYMENT_LABELS = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
  cod_pending: 'Cash on delivery',
}

export const FULFILLMENT_LABELS = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const METHOD_LABELS = {
  upi: 'UPI',
  card: 'Card',
  cod: 'COD',
}
