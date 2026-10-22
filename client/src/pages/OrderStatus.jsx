import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Package, CreditCard, Truck, CheckCircle2, XCircle, RefreshCw, Copy } from 'lucide-react'
import { get, post } from '../lib/api'
import { useToast } from '../lib/toast'
import { inr, formatDateTime, PAYMENT_LABELS, FULFILLMENT_LABELS, METHOD_LABELS } from '../lib/format'
import { PageLoader, Spinner } from '../components/Loader'
import { Pill } from '../components/admin-ui'

function Cash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={props.size || 20} height={props.size || 20} className={props.className}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

function Timeline({ order }) {
  const paid = ['paid', 'refunded'].includes(order.payment_status) || order.payment_status === 'cod_pending'
  const cancelled = order.fulfillment_status === 'cancelled'
  const steps = [
    {
      title: 'Order placed',
      text: formatDateTime(order.created_at),
      state: 'done',
      icon: Package,
    },
    {
      title: PAYMENT_LABELS[order.payment_status] || 'Payment',
      text:
        order.payment_status === 'paid'
          ? `Ref ${order.payment_ref || '—'}`
          : order.payment_status === 'failed'
            ? 'Gateway declined — retry from the panel'
            : order.payment_status === 'cod_pending'
              ? 'Pay in cash when the rider arrives'
              : 'Waiting for you to complete payment',
      state: cancelled ? 'idle' : order.payment_status === 'paid' ? 'done' : order.payment_status === 'failed' ? 'error' : order.payment_status === 'refunded' ? 'idle' : 'active',
      icon: order.payment_method === 'cod' ? Cash : CreditCard,
    },
    {
      title: 'Packed & processing',
      text: cancelled ? 'Order cancelled' : order.fulfillment_status === 'processing' ? 'Our studio is packing your fit' : 'Packed and handed to courier',
      state: cancelled ? 'idle' : ['shipped', 'delivered'].includes(order.fulfillment_status) || (paid && order.fulfillment_status === 'processing') ? 'done' : 'idle',
      icon: Package,
    },
    {
      title: 'Shipped',
      text: order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered' ? 'Out for delivery with our courier partner' : 'Awaiting dispatch',
      state: cancelled ? 'idle' : ['shipped', 'delivered'].includes(order.fulfillment_status) ? 'done' : 'idle',
      icon: Truck,
    },
    {
      title: 'Delivered',
      text: order.fulfillment_status === 'delivered' ? 'Delivered. Enjoy the drip.' : 'Estimated in 3–6 business days',
      state: cancelled ? 'idle' : order.fulfillment_status === 'delivered' ? 'done' : 'idle',
      icon: CheckCircle2,
    },
  ]

  return (
    <ol className="relative space-y-6 pl-10">
      <span className="absolute left-[15px] top-2 bottom-2 w-px bg-ink/10" aria-hidden />
      {steps.map((step, i) => {
        const Icon = step.icon
        const color =
          step.state === 'done' ? 'bg-lime text-ink border-lime' : step.state === 'active' ? 'bg-ink text-bone border-ink' : step.state === 'error' ? 'bg-flare text-bone border-flare' : 'bg-bone-2 text-muted border-ink/15'
        return (
          <li key={i} className="relative animate-fade-up" style={{ animationDelay: `${i * 110}ms` }}>
            <span className={`absolute -left-10 grid h-8 w-8 place-items-center rounded-full border-2 ${color}`}>
              {step.state === 'active' ? <Spinner size={14} /> : <Icon size={14} />}
            </span>
            <p className="font-display text-sm font-bold uppercase tracking-tight">{step.title}</p>
            <p className="mt-0.5 text-xs text-muted">{step.text}</p>
          </li>
        )
      })}
    </ol>
  )
}

function GatewayPanel({ order, onDone }) {
  const [phase, setPhase] = useState('idle')
  const { push } = useToast()
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const run = async (outcome) => {
    setPhase('processing')
    timerRef.current = setTimeout(async () => {
      try {
        const data = await post(`/api/orders/${order.order_code}/simulate`, { outcome })
        if (data.payment_status === 'paid') push('Payment captured successfully')
        else push('Payment failed — you can retry', 'error')
        setPhase('idle')
        onDone()
      } catch (err) {
        push(err.message, 'error')
        setPhase('idle')
      }
    }, 2200)
  }

  if (order.payment_method === 'cod') {
    return (
      <div className="rounded-2xl border border-ink/10 bg-bone-2/70 p-6">
        <p className="font-display text-lg font-black uppercase tracking-tight">Cash on delivery</p>
        <p className="mt-2 text-sm text-muted">Keep {inr(order.total)} ready. You can pay the rider by cash or UPI on delivery.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/10 bg-ink px-6 py-4 text-bone">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em]">
          <span className={`h-2 w-2 rounded-full ${phase === 'processing' ? 'bg-amber-400 animate-pulse-dot' : 'bg-lime'}`} />
          Secure gateway · {METHOD_LABELS[order.payment_method]}
        </p>
        <span className="text-xs text-bone/50">{inr(order.total)}</span>
      </div>

      {phase === 'processing' ? (
        <div className="px-6 py-12 text-center">
          <Spinner size={34} className="mx-auto text-ink" />
          <p className="mt-5 font-display text-lg font-black uppercase tracking-tight">Contacting bank…</p>
          <p className="mt-1 text-sm text-muted">Do not refresh this page</p>
          <div className="mx-auto mt-6 h-1 w-56 overflow-hidden rounded-full bg-bone-2">
            <span className="block h-full w-1/3 animate-spin-slow rounded-full bg-lime" />
          </div>
        </div>
      ) : (
        <div className="p-6">
          <p className="text-sm text-muted">This is a simulated gateway. Choose an outcome to see how payment status updates live.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={() => run('success')} className="btn-press shine rounded-full bg-lime px-6 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-ink hover:bg-ink hover:text-lime">
              Pay {inr(order.total)}
            </button>
            <button onClick={() => run('fail')} className="btn-press rounded-full border border-flare/40 px-6 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-flare hover:bg-flare hover:text-bone">
              Simulate failure
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderStatus() {
  const { code } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await get(`/api/orders/track/${code}`)
      setOrder(data.order)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [code])

  useEffect(() => {
    const controller = new AbortController()
    get(`/api/orders/track/${code}`, controller.signal)
      .then((data) => setOrder(data.order))
      .catch((err) => {
      if (err.name !== 'AbortError') setError(err.message)
    })
    return () => controller.abort()
  }, [code])

  useEffect(() => {
    if (!order) return
    const live = order.payment_status === 'pending' || order.fulfillment_status === 'processing'
    if (!live) return
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [order, load])

  if (error) {
    return (
      <div className="page-enter mx-auto max-w-3xl px-4 py-24 text-center">
        <XCircle size={44} className="mx-auto text-flare" />
        <h1 className="mt-5 font-display text-3xl font-black uppercase">{error}</h1>
        <p className="mt-2 text-muted">Double-check the order ID from your confirmation.</p>
        <Link to="/track" className="btn-press mt-7 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bone">
          Try another lookup
        </Link>
      </div>
    )
  }

  if (!order) return <PageLoader label="Fetching order" />

  return (
    <div className="page-enter mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime-2">
            {location.state?.justPlaced ? 'Order confirmed' : 'Order status'}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-black uppercase tracking-[-0.045em]">{order.order_code}</h1>
          <p className="mt-2 text-sm text-muted">Placed {formatDateTime(order.created_at)} · {order.items.length} item(s)</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Pill status={order.payment_status} className="text-[11px]" />
          <Pill status={order.fulfillment_status} className="text-[11px]" />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(order.order_code)
              setCopied(true)
              setTimeout(() => setCopied(false), 1600)
            }}
            className="btn-press flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-ink hover:text-bone"
          >
            <Copy size={12} /> {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">Live timeline</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <RefreshCw size={12} className="animate-spin-slow" /> Auto-refreshes while your order is in motion
          </p>
          <div className="mt-7">
            <Timeline order={order} />
          </div>
        </section>

        <div className="space-y-6">
          {order.payment_status === 'pending' && <GatewayPanel order={order} onDone={load} />}
          {order.payment_status === 'cod_pending' && <GatewayPanel order={order} onDone={load} />}
          {order.payment_status === 'failed' && (
            <div className="rounded-2xl border border-flare/30 bg-flare/5 p-6">
              <p className="font-display text-lg font-black uppercase text-flare">Payment failed</p>
              <p className="mt-2 text-sm text-muted">The gateway declined this transaction. Retry below or switch method from support.</p>
              <GatewayPanel order={{ ...order, payment_status: 'pending' }} onDone={load} />
            </div>
          )}

          <section className="rounded-2xl border border-ink/10 bg-white p-6">
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Items</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-muted"> · {item.size || 'OS'} × {item.qty}</span>
                  </span>
                  <span className="font-semibold">{inr(item.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-lime-2"><dt>Discount {order.discount_code ? `(${order.discount_code})` : ''}</dt><dd>−{inr(order.discount_amount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping === 0 ? 'FREE' : inr(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-lg font-black uppercase"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-bone-2/60 p-6 text-sm">
            <h2 className="font-display text-base font-black uppercase tracking-tight">Shipping to</h2>
            <p className="mt-2 leading-relaxed text-ink/75">
              {order.customer_name}<br />
              {order.address}, {order.city}<br />
              {order.state} — {order.pincode}<br />
              <span className="text-muted">{order.phone} · {order.email}</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
