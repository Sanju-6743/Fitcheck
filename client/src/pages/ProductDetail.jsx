import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import { get } from '../lib/api'
import { useCart } from '../lib/cart'
import { useToast } from '../lib/toast'
import { inr } from '../lib/format'
import ProductCard from '../components/ProductCard'
import { PageLoader } from '../components/Loader'
import Reveal from '../components/Reveal'

export default function ProductDetail() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const { add } = useCart()
  const { push } = useToast()

  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setError(null)
    setSize(null)
    setQty(1)
    get(`/api/products/${slug}`, controller.signal)
      .then((d) => {
        setData(d)
        setSize(d.product.sizes?.[0] || null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [slug])

  if (error) {
    return (
      <div className="page-enter mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-display text-3xl font-black uppercase">{error}</p>
        <Link to="/shop" className="btn-press mt-6 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bone">
          Back to shop
        </Link>
      </div>
    )
  }

  if (!data) return <PageLoader label="Loading product" />

  const { product, related } = data
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink transition-colors">
        <ArrowLeft size={16} /> Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <div className="overflow-hidden rounded-3xl bg-bone-2 aspect-[4/5]">
            <img
              src={product.image}
              alt={product.name}
              className="hero-zoom h-full w-full object-cover"
              loading="eager"
            />
          </div>
          {discount && (
            <span className="absolute left-4 top-4 rounded-full bg-lime px-3.5 py-1.5 text-xs font-black uppercase tracking-wider animate-pop">
              Save {discount}%
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-2">{product.category}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-black uppercase leading-[0.95] tracking-[-0.04em]">
            {product.name}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-black">{inr(product.price)}</span>
            {product.compare_at_price > product.price && (
              <span className="text-lg text-muted line-through">{inr(product.compare_at_price)}</span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted">Select size</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`btn-press min-w-14 rounded-xl border px-4 py-3 text-sm font-bold uppercase transition-colors ${
                    size === s ? 'border-ink bg-ink text-bone' : 'border-ink/15 hover:border-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 rounded-full border border-ink/15 px-1.5 py-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Decrease quantity">
                <Minus size={15} />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="grid h-10 w-10 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Increase quantity">
                <Plus size={15} />
              </button>
            </div>
            <button
              disabled={product.stock === 0}
              onClick={() => {
                add(product, size, qty)
                push(`${product.name} (${size}) added to bag`)
              }}
              className="btn-press shine flex-1 rounded-full bg-ink px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-bone hover:bg-lime hover:text-ink disabled:opacity-40 disabled:pointer-events-none sm:flex-none sm:min-w-60"
            >
              {product.stock === 0 ? 'Sold out' : 'Add to bag'}
            </button>
          </div>

          <p className={`mt-4 text-sm font-semibold ${product.stock === 0 ? 'text-flare' : product.stock <= product.low_stock_threshold ? 'text-flare' : 'text-lime-2'}`}>
            {product.stock === 0
              ? 'Out of stock — restock alerts via newsletter'
              : product.stock <= product.low_stock_threshold
                ? `⚡ Only ${product.stock} left in stock`
                : `✓ In stock — ${product.stock} units ready to ship`}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-ink/10 pt-8 text-center">
            {[
              { icon: Truck, label: 'Free over ₹1,999' },
              { icon: RotateCcw, label: '7-day returns' },
              { icon: ShieldCheck, label: 'Secure checkout' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 rounded-2xl bg-bone-2/70 px-2 py-4">
                <item.icon size={18} className="text-lime-2" />
                <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related?.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">You may also like</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
