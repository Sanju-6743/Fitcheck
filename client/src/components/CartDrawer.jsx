import { Link, useNavigate } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '../lib/cart'
import { inr } from '../lib/format'

export default function CartDrawer() {
  const { items, subtotal, count, drawerOpen, setDrawerOpen, updateQty, remove } = useCart()
  const navigate = useNavigate()
  if (!drawerOpen) return null

  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="overlay-in absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      <aside className="drawer-in absolute right-0 top-0 flex h-full w-[min(420px,100vw)] flex-col bg-bone shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">
            Your bag <span className="text-muted">({count})</span>
          </h2>
          <button onClick={() => setDrawerOpen(false)} className="grid h-9 w-9 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Close bag">
            <X size={18} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-bone-2">
              <ShoppingBag size={28} className="text-muted" />
            </div>
            <p className="font-display text-lg font-bold uppercase">Bag is empty</p>
            <p className="text-sm text-muted">Fill it with something that slaps.</p>
            <Link to="/shop" onClick={() => setDrawerOpen(false)} className="btn-press shine mt-2 rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wider text-bone hover:bg-lime hover:text-ink">
              Shop the drop
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item, i) => (
                <div key={item.key} className="animate-fade-up flex gap-4" style={{ animationDelay: `${i * 60}ms` }}>
                  <Link to={`/product/${item.slug}`} onClick={() => setDrawerOpen(false)} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-bone-2">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-display text-sm font-bold uppercase leading-tight">{item.name}</p>
                      <button onClick={() => remove(item.key)} className="text-muted hover:text-flare transition-colors" aria-label="Remove">
                        <X size={15} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">Size {item.size || 'OS'}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-ink/15 px-1">
                        <button onClick={() => updateQty(item.key, item.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Decrease">
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.key, item.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Increase">
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{inr(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-ink/10 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                <span className="font-semibold">{shipping === 0 ? 'FREE' : inr(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="rounded-lg bg-lime/25 px-3 py-2 text-xs font-medium">
                  Add {inr(1999 - subtotal)} more for free shipping
                </p>
              )}
              <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-lg font-black uppercase">
                <span>Total</span>
                <span>{inr(subtotal + shipping)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => { setDrawerOpen(false); navigate('/cart') }} className="btn-press rounded-full border border-ink px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-bone">
                  View bag
                </button>
                <button onClick={() => { setDrawerOpen(false); navigate('/checkout') }} className="btn-press shine rounded-full bg-ink px-4 py-3 text-xs font-bold uppercase tracking-wider text-bone hover:bg-lime hover:text-ink">
                  Checkout
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
