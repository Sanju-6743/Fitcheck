import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Banknote, Ban, Truck, CheckCircle2, RotateCcw, CreditCard } from 'lucide-react'
import { get, patch } from '../lib/api'
import { useToast } from '../lib/toast'
import { inr, formatDateTime, PAYMENT_LABELS, FULFILLMENT_LABELS, METHOD_LABELS } from '../lib/format'
import Modal from '../components/Modal'
import { Skeleton, Spinner } from '../components/Loader'
import { Pill, Button, EmptyState } from '../components/admin-ui'

const paymentFilters = [
  { value: '', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'cod_pending', label: 'COD due' },
  { value: 'refunded', label: 'Refunded' },
]

export default function AdminOrders() {
  const { push } = useToast()
  const [params, setParams] = useSearchParams()
  const [orders, setOrders] = useState(null)
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(params.get('payment') || '')
  const [focusId, setFocusId] = useState(params.get('focus'))
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    const query = new URLSearchParams()
    if (paymentStatus) query.set('payment_status', paymentStatus)
    if (search) query.set('search', search)
    get(`/api/admin/orders?${query}`)
      .then((d) => setOrders(d.orders))
      .catch((err) => push(err.message, 'error'))
  }, [paymentStatus, search, push])

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  useEffect(() => {
    if (!focusId || !orders) return
    const found = orders.find((o) => o.id === Number(focusId))
    if (found) setDetail(found)
  }, [focusId, orders])

  const update = async (order, body) => {
    setBusy(true)
    try {
      const data = await patch(`/api/admin/orders/${order.id}`, body)
      push('Order updated')
      setDetail((prev) => (prev ? data.order : prev))
      load()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const closeDetail = () => {
    setDetail(null)
    setFocusId(null)
    params.delete('focus')
    setParams(params, { replace: true })
  }

  const totals = useMemo(() => {
    if (!orders) return null
    return {
      count: orders.length,
      sum: orders.filter((o) => o.payment_status !== 'failed').reduce((s, o) => s + o.total, 0),
    }
  }, [orders])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            {totals ? `${totals.count} orders · ${inr(totals.sum)} GMV in view` : 'Loading…'}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order ID, name, email…"
            className="w-64 rounded-full border border-line bg-ink-2 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-lime transition-colors"
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {paymentFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setPaymentStatus(f.value)}
            className={`btn-press shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              paymentStatus === f.value ? 'border-lime bg-lime text-ink' : 'border-line hover:bg-line/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!orders ? (
        <Skeleton dark className="h-96 rounded-2xl" />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Truck size={22} />} title="No orders here" subtitle="Orders will appear as customers check out." />
      ) : (
        <div className="rounded-2xl border border-line bg-ink-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                  <th className="px-6 py-3.5 font-bold">Order</th>
                  <th className="px-4 py-3.5 font-bold">Customer</th>
                  <th className="px-4 py-3.5 font-bold">Items</th>
                  <th className="px-4 py-3.5 font-bold">Total</th>
                  <th className="px-4 py-3.5 font-bold">Payment</th>
                  <th className="px-4 py-3.5 font-bold">Fulfillment</th>
                  <th className="px-6 py-3.5 font-bold text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    onClick={() => setDetail(order)}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-line/25 transition-colors"
                    style={{ animation: `fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 28, 300)}ms both` }}
                  >
                    <td className="px-6 py-3.5 font-semibold text-lime">{order.order_code}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted">{order.city} · {METHOD_LABELS[order.payment_method]}</p>
                    </td>
                    <td className="px-4 py-3.5 text-bone/60">{order.items.reduce((s, it) => s + it.qty, 0)}</td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">{inr(order.total)}</td>
                    <td className="px-4 py-3.5"><Pill status={order.payment_status} /></td>
                    <td className="px-4 py-3.5"><Pill status={order.fulfillment_status} /></td>
                    <td className="px-6 py-3.5 text-right text-xs text-muted">{formatDateTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={closeDetail} title={detail?.order_code || 'Order'} wide>
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Pill status={detail.payment_status} className="text-[11px]" />
              <Pill status={detail.fulfillment_status} className="text-[11px]" />
              <span className="rounded-full border border-line px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-bone/70">
                {METHOD_LABELS[detail.payment_method]}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <section className="rounded-xl border border-line bg-ink p-4 text-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Customer</h4>
                <p className="mt-2 font-semibold">{detail.customer_name}</p>
                <p className="text-bone/60">{detail.email}</p>
                <p className="text-bone/60">{detail.phone}</p>
                <p className="mt-2 leading-relaxed text-bone/70">{detail.address}, {detail.city}<br />{detail.state} — {detail.pincode}</p>
              </section>
              <section className="rounded-xl border border-line bg-ink p-4 text-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Payment ledger</h4>
                {detail.payments?.length ? (
                  <ul className="mt-2 space-y-2">
                    {detail.payments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="text-bone/70">
                          {p.event.replace('_', ' ')}
                          <span className="block text-[11px] text-muted">{formatDateTime(p.created_at)}</span>
                        </span>
                        <span className={`font-semibold tabular-nums ${p.amount < 0 ? 'text-flare' : 'text-lime'}`}>
                          {p.amount < 0 ? '−' : ''}{inr(Math.abs(p.amount))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted">No ledger entries yet.</p>
                )}
                {detail.payment_ref && <p className="mt-3 break-all text-[11px] text-muted">Ref: {detail.payment_ref}</p>}
              </section>
            </div>

            <section className="rounded-xl border border-line bg-ink overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                    <th className="px-4 py-2.5 font-bold">Item</th>
                    <th className="px-4 py-2.5 font-bold">Size</th>
                    <th className="px-4 py-2.5 font-bold text-right">Qty</th>
                    <th className="px-4 py-2.5 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item) => (
                    <tr key={item.id} className="border-b border-line/50 last:border-0">
                      <td className="px-4 py-2.5">{item.name}</td>
                      <td className="px-4 py-2.5 text-bone/60">{item.size || 'OS'}</td>
                      <td className="px-4 py-2.5 text-right">{item.qty}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{inr(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-line px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between text-bone/60"><span>Subtotal</span><span>{inr(detail.subtotal)}</span></div>
                {detail.discount_amount > 0 && (
                  <div className="flex justify-between text-lime"><span>Discount {detail.discount_code}</span><span>−{inr(detail.discount_amount)}</span></div>
                )}
                <div className="flex justify-between text-bone/60"><span>Shipping</span><span>{detail.shipping === 0 ? 'FREE' : inr(detail.shipping)}</span></div>
                <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-black uppercase"><span>Total</span><span>{inr(detail.total)}</span></div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Actions</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.payment_status === 'cod_pending' && (
                  <Button loading={busy} onClick={() => update(detail, { payment_status: 'paid' })}>
                    <Banknote size={14} /> Record COD collected
                  </Button>
                )}
                {detail.payment_status === 'pending' && (
                  <Button loading={busy} onClick={() => update(detail, { payment_status: 'paid' })}>
                    <CreditCard size={14} /> Mark as paid
                  </Button>
                )}
                {detail.payment_status === 'failed' && (
                  <Button loading={busy} onClick={() => update(detail, { payment_status: 'pending' })}>
                    <RotateCcw size={14} /> Reset to pending
                  </Button>
                )}
                {detail.payment_status === 'paid' && (
                  <Button variant="danger" loading={busy} onClick={() => confirm(`Refund ${inr(detail.total)} for ${detail.order_code}?`) && update(detail, { payment_status: 'refunded' })}>
                    <RotateCcw size={14} /> Refund
                  </Button>
                )}
                {detail.fulfillment_status === 'processing' && (
                  <>
                    <Button loading={busy} onClick={() => update(detail, { fulfillment_status: 'shipped' })}>
                      <Truck size={14} /> Mark shipped
                    </Button>
                    <Button variant="danger" loading={busy} onClick={() => confirm('Cancel this order and restock items?') && update(detail, { fulfillment_status: 'cancelled' })}>
                      <Ban size={14} /> Cancel order
                    </Button>
                  </>
                )}
                {detail.fulfillment_status === 'shipped' && (
                  <Button loading={busy} onClick={() => update(detail, { fulfillment_status: 'delivered' })}>
                    <CheckCircle2 size={14} /> Mark delivered
                  </Button>
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  )
}
