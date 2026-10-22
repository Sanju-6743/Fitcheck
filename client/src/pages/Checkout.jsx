import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Smartphone, Banknote, Tag, Lock, ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { useCart } from '../lib/cart'
import { useToast } from '../lib/toast'
import { useLocationStore } from '../lib/location'
import { post } from '../lib/api'
import { lookupPincode } from '../lib/geo'
import { inr } from '../lib/format'
import { lightInputClass, Field, Button } from '../components/admin-ui'
import AddressInput from '../components/AddressInput'

const methods = [
  { id: 'upi', icon: Smartphone, label: 'UPI', hint: 'GPay · PhonePe · Paytm' },
  { id: 'card', icon: CreditCard, label: 'Card', hint: 'Visa · Mastercard · RuPay' },
  { id: 'cod', icon: Banknote, label: 'COD', hint: 'Cash on delivery' },
]

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { push } = useToast()
  const navigate = useNavigate()
  const { location: deliveryLocation } = useLocationStore()

  const [method, setMethod] = useState('cod')
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(null)
  const [promoError, setPromoError] = useState(null)
  const [promoOpen, setPromoOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [pinBusy, setPinBusy] = useState(false)
  const [pinStatus, setPinStatus] = useState(null)
  const [form, setForm] = useState({
    customer_name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  })

  useEffect(() => {
    if (!deliveryLocation) return
    setForm((f) => ({
      ...f,
      pincode: f.pincode || deliveryLocation.pincode || '',
      city: f.city || deliveryLocation.city || '',
      state: f.state || deliveryLocation.state || '',
    }))
  }, [deliveryLocation])

  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99
  const discountAmount = applied?.amount || 0
  const total = Math.max(0, subtotal - discountAmount) + shipping

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onPincodeBlur = async () => {
    const pin = form.pincode.trim()
    if (!/^\d{6}$/.test(pin)) {
      if (pin) setPinStatus({ ok: false, text: 'Pincode must be 6 digits' })
      else setPinStatus(null)
      return
    }
    setPinBusy(true)
    setPinStatus(null)
    try {
      const place = await lookupPincode(pin)
      if (place) {
        setForm((f) => ({ ...f, city: place.city, state: place.state }))
        setPinStatus({ ok: true, text: `${place.city}, ${place.state} auto-filled ✓` })
        push(`Delivery city set to ${place.city}, ${place.state}`)
      } else {
        setPinStatus({ ok: false, text: 'Pincode not found — enter city & state manually' })
      }
    } catch {
      setPinStatus({ ok: false, text: 'Could not verify pincode — enter city & state manually' })
    } finally {
      setPinBusy(false)
    }
  }

  const onAddressSelected = (place) => {
    setForm((f) => ({
      ...f,
      address: place.full || f.address,
      pincode: place.pincode || f.pincode,
      city: place.city || f.city,
      state: place.state || f.state,
    }))
    if (place.pincode || place.city) setPinStatus({ ok: true, text: 'Address details picked from map ✓' })
  }

  const applyPromo = async () => {
    if (!code.trim()) {
      setPromoError('Enter a code first')
      return
    }
    setChecking(true)
    setPromoError(null)
    try {
      const data = await post('/api/discounts/validate', { code: code.trim(), subtotal })
      setApplied(data.discount)
      push(`Code ${data.discount.code} applied — you save ${inr(data.discount.amount)}`)
    } catch (err) {
      setApplied(null)
      setPromoError(err.message)
    } finally {
      setChecking(false)
    }
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    if (!form.pincode.trim() || !form.city.trim() || !form.state.trim()) {
      push('Please enter a valid pincode — city and state are required for delivery', 'error')
      return
    }
    setLoading(true)
    try {
      const data = await post('/api/orders', {
        ...form,
        payment_method: method,
        discount_code: applied?.code || null,
        items: items.map((i) => ({ product_id: i.id, qty: i.qty, size: i.size })),
      })
      clear()
      push('Order placed successfully')
      navigate(`/order/${data.order.order_code}`, { state: { justPlaced: true } })
    } catch (err) {
      push(err.message, 'error')
      setLoading(false)
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="page-enter mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-black uppercase">Nothing to checkout</h1>
        <p className="mt-2 text-muted">Add something to your bag first.</p>
        <Link to="/shop" className="btn-press mt-6 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bone">
          Shop the drop
        </Link>
      </div>
    )
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime-2">Almost there</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl font-black uppercase tracking-[-0.045em]">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl font-black uppercase tracking-tight">1 · Delivery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <input required className={lightInputClass} value={form.customer_name} onChange={set('customer_name')} placeholder="Aarav Mehta" />
              </Field>
              <Field label="Email" required>
                <input required type="email" className={lightInputClass} value={form.email} onChange={set('email')} placeholder="you@email.com" />
              </Field>
              <Field label="Phone" required>
                <input required className={lightInputClass} value={form.phone} onChange={set('phone')} placeholder="98765 43210" />
              </Field>
              <Field label="Pincode" required hint={pinStatus?.text || 'Auto-fills your city & state'}>
                <div className="relative">
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    className={`${lightInputClass} pr-10`}
                    value={form.pincode}
                    onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                    onBlur={onPincodeBlur}
                    placeholder="400050"
                  />
                  {pinBusy && (
                    <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />
                  )}
                  {!pinBusy && pinStatus?.ok && (
                    <CheckCircle2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lime-2" />
                  )}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address (house no, street, landmark)" required hint="Start typing — pick from suggestions for accurate delivery">
                  <AddressInput
                    required
                    value={form.address}
                    onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                    onPlaceSelected={onAddressSelected}
                    placeholder="Search address, or type it manually…"
                  />
                </Field>
              </div>
              <Field label="City" required>
                <input required className={lightInputClass} value={form.city} onChange={set('city')} placeholder="Mumbai" />
              </Field>
              <Field label="State" required>
                <input required className={lightInputClass} value={form.state} onChange={set('state')} placeholder="Maharashtra" />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-black uppercase tracking-tight">2 · Payment</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`btn-press rounded-2xl border p-5 text-left transition-all ${
                    method === m.id ? 'border-ink bg-ink text-bone shadow-xl shadow-ink/15' : 'border-ink/15 bg-white hover:border-ink'
                  }`}
                >
                  <m.icon size={20} className={method === m.id ? 'text-lime' : 'text-lime-2'} />
                  <p className="mt-3 font-display font-bold uppercase">{m.label}</p>
                  <p className={`mt-1 text-xs ${method === m.id ? 'text-bone/55' : 'text-muted'}`}>{m.hint}</p>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <Lock size={13} />
              {method === 'cod'
                ? 'Pay in cash (or UPI) to the delivery partner. Order ships after confirmation.'
                : 'Payments run through a secure gateway — status updates live on your order page.'}
            </p>
          </section>
        </div>

        <aside className="h-max rounded-2xl bg-ink p-6 text-bone sticky top-24">
          <h2 className="font-display text-xl font-black uppercase tracking-tight">Order summary</h2>

          <ul className="mt-5 space-y-3 max-h-56 overflow-y-auto no-scrollbar pr-1">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-sm">
                <img src={item.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-bone/50 text-xs">{item.size || 'OS'} · ×{item.qty}</p>
                </div>
                <span className="font-semibold">{inr(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          {/* Promo code — always visible */}
          <div className="mt-5 rounded-2xl border border-line bg-ink-2 p-4">
            {!promoOpen && !applied ? (
              <button
                type="button"
                onClick={() => setPromoOpen(true)}
                className="btn-press flex w-full items-center gap-2.5 text-left"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                  <Tag size={15} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold uppercase tracking-tight">Have a promo code?</span>
                  <span className="block text-xs text-muted">Apply offers & save on this order</span>
                </span>
                <span className="rounded-full border border-lime/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-lime">
                  Apply
                </span>
              </button>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="w-full rounded-xl border border-line bg-ink py-3 pl-9 pr-3 text-sm uppercase tracking-wider text-bone placeholder:text-muted outline-none focus:border-lime transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={checking}
                    className="btn-press rounded-xl bg-lime px-5 text-xs font-black uppercase tracking-wider text-ink hover:bg-bone disabled:opacity-50"
                  >
                    {checking ? '…' : 'Apply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPromoOpen(false); setApplied(null); setCode(''); setPromoError(null) }}
                    className="grid h-[46px] w-[46px] place-items-center rounded-xl border border-line text-muted hover:bg-line/50 transition-colors"
                    aria-label="Close promo"
                  >
                    <X size={15} />
                  </button>
                </div>
                {promoError && <p className="mt-2 text-xs text-flare">{promoError}</p>}
                {applied && (
                  <p className="mt-2 flex items-center gap-2 rounded-xl bg-lime/15 px-3 py-2 text-xs text-lime">
                    <CheckCircle2 size={13} />
                    <span className="flex-1">{applied.code} applied — {applied.description || `saves ${inr(applied.amount)}`}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-bone/15 pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-bone/55">Subtotal</dt><dd>{inr(subtotal)}</dd></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-lime"><dt>Discount</dt><dd>−{inr(discountAmount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-bone/55">Shipping</dt><dd>{shipping === 0 ? 'FREE' : inr(shipping)}</dd></div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-bone/15 pt-4 font-display text-2xl font-black uppercase">
            <span>Total</span>
            <span>{inr(total)}</span>
          </div>

          <Button type="submit" loading={loading} className="mt-6 w-full py-4">
            {loading ? 'Placing order…' : <>Place order · {method === 'cod' ? 'COD' : method.toUpperCase()} <ArrowRight size={15} /></>}
          </Button>
          <p className="mt-3 text-center text-[11px] text-bone/40">No account needed — checkout as guest.</p>
        </aside>
      </form>
    </div>
  )
}
