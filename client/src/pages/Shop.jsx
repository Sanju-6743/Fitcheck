import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { get } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { ProductCardSkeleton, ProgressBar } from '../components/Loader'

const sorts = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name', label: 'A–Z' },
]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const category = params.get('category') || ''
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'newest'

  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setError(null)
    const query = new URLSearchParams({ sort, limit: '48' })
    if (category) query.set('category', category)
    if (search) query.set('search', search)
    get(`/api/products?${query}`, controller.signal)
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [category, search, sort])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const categories = useMemo(() => data?.categories || [], [data])

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <ProgressBar key={`${category}-${search}-${sort}`} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime-2">Catalogue</p>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl font-black uppercase tracking-[-0.045em]">
            {category ? category : 'All fits'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              defaultValue={search}
              onKeyDown={(e) => e.key === 'Enter' && setParam('search', e.currentTarget.value)}
              placeholder="Search fits…"
              className="w-48 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm outline-none transition-all focus:border-ink focus:ring-2 focus:ring-ink/10"
            />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2">
            <SlidersHorizontal size={14} className="text-muted" />
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="bg-transparent text-sm outline-none cursor-pointer"
              aria-label="Sort products"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mt-8 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c, label: c }))].map((cat) => (
          <button
            key={cat.value || 'all'}
            onClick={() => setParam('category', cat.value)}
            className={`btn-press shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border transition-colors ${
              category === cat.value ? 'bg-ink text-bone border-ink' : 'border-ink/15 hover:border-ink'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-10 rounded-2xl border border-flare/30 bg-flare/5 px-6 py-5 text-sm text-flare">{error}</p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {data === null && !error
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.products?.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
      </div>

      {data && data.products.length === 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
          <p className="font-display text-2xl font-black uppercase">Nothing matches</p>
          <p className="mt-2 text-sm text-muted">Try another category or clear the search.</p>
        </div>
      )}
    </div>
  )
}
