import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useCart } from '../lib/cart'
import { useToast } from '../lib/toast'
import { inr } from '../lib/format'

export default function ProductCard({ product, index = 0 }) {
  const { add } = useCart()
  const { push } = useToast()
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null
  const low = product.stock > 0 && product.stock <= product.low_stock_threshold

  return (
    <article
      className="group card-lift relative flex flex-col"
      style={{ animation: `fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) ${Math.min(index * 70, 420)}ms both` }}
    >
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden rounded-2xl bg-bone-2 aspect-[4/5]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
            −{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-bone">
            Sold out
          </span>
        )}
        {low && product.stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-flare px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-bone">
            Only {product.stock} left
          </span>
        )}
        <span className="absolute bottom-3 left-3 translate-y-3 rounded-full bg-bone/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View drop
        </span>
      </Link>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted">{product.category}</p>
          <Link to={`/product/${product.slug}`} className="mt-1 block truncate font-display text-[15px] font-bold uppercase tracking-tight link-underline">
            {product.name}
          </Link>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-semibold">{inr(product.price)}</span>
            {product.compare_at_price > product.price && (
              <span className="text-sm text-muted line-through">{inr(product.compare_at_price)}</span>
            )}
          </div>
        </div>
        <button
          disabled={product.stock === 0}
          onClick={() => {
            add(product, product.sizes?.[0] || 'M', 1)
            push(`${product.name} added to bag`)
          }}
          className="btn-press shine mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-bone hover:bg-lime hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
          aria-label={`Add ${product.name} to bag`}
        >
          <Plus size={18} />
        </button>
      </div>
    </article>
  )
}
