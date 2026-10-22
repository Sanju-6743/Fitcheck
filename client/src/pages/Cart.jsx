import { Link, useNavigate } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../lib/cart'
import { inr } from '../lib/format'

export default function CartPage() {
  const { items, subtotal, updateQty, remove } = useCart()
  const navigate = useNavigate()
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99

  if (items.length === 0) {
    return (
      <div className="page-enter mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-bone-2">
          <ShoppingBag size={34} className="text-muted" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-black uppercase tracking-tight">Bag is empty</h1>
        <p className="mt-2 text-muted">Go grab something that slaps.</p>
        <Link to="/shop" className="btn-press shine mt-8 inline-block rounded-full bg-ink px-10 py-4 text-sm font-black uppercase tracking-[0.15em] text-bone hover:bg-lime hover:text-ink">
          Shop the drop
        </Link>
      </div>
    )
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-[-0.045em]">Your bag</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {items.map((item, i) => (
            <div key={item.key} className="animate-fade-up flex gap-5 rounded-2xl border border-ink/10 bg-white p-4" style={{ animationDelay: `${i * 70}ms` }}>
              <Link to={`/product/${item.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-bone-2">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link to={`/product/${item.slug}`} className="font-display text-base font-bold uppercase leading-tight link-underline">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">Size {item.size || 'OS'} · {inr(item.price)} each</p>
                  </div>
                  <button onClick={() => remove(item.key)} className="h-8 w-8 grid place-items-center rounded-full text-muted hover:text-flare hover:bg-flare/10 transition-colors" aria-label="Remove item">
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-1 rounded-full border border-ink/15 px-1">
                    <button onClick={() => updateQty(item.key, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Decrease">
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, item.qty + 1)} className="grid h-8 w-8 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Increase">
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-display text-lg font-black">{inr(item.price * item.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-max rounded-2xl bg-ink p-6 text-bone sticky top-24">
          <h2 className="font-display text-xl font-black uppercase tracking-tight">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-bone/60">Subtotal</dt><dd className="font-semibold">{inr(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-bone/60">Shipping</dt><dd className="font-semibold">{shipping === 0 ? 'FREE' : inr(shipping)}</dd></div>
          </dl>
          {shipping > 0 && (
            <p className="mt-4 rounded-xl bg-lime/15 px-4 py-3 text-xs text-lime">
              Add {inr(1999 - subtotal)} more to unlock free shipping
            </p>
          )}
          <div className="mt-5 flex justify-between border-t border-bone/15 pt-4 font-display text-2xl font-black uppercase">
            <span>Total</span>
            <span>{inr(subtotal + shipping)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-press shine mt-6 w-full rounded-full bg-lime px-6 py-4 text-sm font-black uppercase tracking-[0.15em] text-ink hover:bg-bone">
            Checkout <ArrowRight size={15} className="inline ml-1 -mt-0.5" />
          </button>
          <Link to="/shop" className="mt-3 block text-center text-xs font-semibold uppercase tracking-wider text-bone/50 hover:text-bone transition-colors">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}
