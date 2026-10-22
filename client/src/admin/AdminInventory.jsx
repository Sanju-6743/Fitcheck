import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, AlertTriangle, Search } from 'lucide-react'
import { get, patch } from '../lib/api'
import { useToast } from '../lib/toast'
import { Skeleton, Spinner } from '../components/Loader'
import { inputClass, Button } from '../components/admin-ui'

export default function AdminInventory() {
  const { push } = useToast()
  const [products, setProducts] = useState(null)
  const [search, setSearch] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [busy, setBusy] = useState(null)

  const load = () => get('/api/admin/products').then((d) => setProducts(d.products)).catch((err) => push(err.message, 'error'))
  useEffect(() => { load() }, [])

  const rows = useMemo(() => {
    if (!products) return null
    const q = search.toLowerCase()
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q))
      .filter((p) => (onlyLow ? p.stock <= p.low_stock_threshold : true))
      .sort((a, b) => a.stock - b.stock)
  }, [products, search, onlyLow])

  const adjust = async (product, delta) => {
    setBusy(`${product.id}-${delta}`)
    try {
      const data = await patch(`/api/admin/products/${product.id}/stock`, { delta })
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product : p)))
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setBusy(null)
    }
  }

  const totalUnits = products?.reduce((s, p) => s + p.stock, 0) ?? 0
  const lowCount = products?.filter((p) => p.stock <= p.low_stock_threshold).length ?? 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Inventory</h1>
          <p className="mt-1 text-sm text-muted">
            {products ? `${totalUnits} units across ${products.length} SKUs` : 'Loading…'}
            {lowCount > 0 && <span className="text-flare"> · {lowCount} need restock</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-52 rounded-full border border-line bg-ink-2 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-lime transition-colors"
            />
          </div>
          <button
            onClick={() => setOnlyLow((v) => !v)}
            className={`btn-press rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              onlyLow ? 'border-flare bg-flare/15 text-flare' : 'border-line hover:bg-line/40'
            }`}
          >
            <AlertTriangle size={13} className="inline mr-1 -mt-0.5" /> Low stock only
          </button>
        </div>
      </header>

      {!rows ? (
        <Skeleton dark className="h-96 rounded-2xl" />
      ) : (
        <div className="rounded-2xl border border-line bg-ink-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                  <th className="px-6 py-3.5 font-bold">Product</th>
                  <th className="px-4 py-3.5 font-bold">Category</th>
                  <th className="px-4 py-3.5 font-bold">Price</th>
                  <th className="px-4 py-3.5 font-bold w-64">Stock level</th>
                  <th className="px-6 py-3.5 font-bold text-right">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((product, i) => {
                  const pct = Math.min(100, (product.stock / Math.max(product.low_stock_threshold * 4, 40)) * 100)
                  const low = product.stock <= product.low_stock_threshold
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-line/60 last:border-0 hover:bg-line/20 transition-colors"
                      style={{ animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 35, 350)}ms both` }}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt="" className="h-11 w-9 rounded-lg object-cover bg-ink-3" />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            {low && (
                              <p className={`text-[11px] font-bold uppercase tracking-wider ${product.stock === 0 ? 'text-flare' : 'text-amber-300'}`}>
                                {product.stock === 0 ? 'Out of stock' : `Reorder soon · threshold ${product.low_stock_threshold}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-bone/60">{product.category}</td>
                      <td className="px-4 py-3.5 tabular-nums">₹{product.price.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-3">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${product.stock === 0 ? 'bg-flare' : low ? 'bg-amber-400' : 'bg-lime'}`}
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                          <span className={`w-10 text-right font-display font-black tabular-nums ${low ? 'text-flare' : ''}`}>
                            {product.stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => adjust(product, -1)}
                            disabled={product.stock === 0 || busy === `${product.id}--1`}
                            className="btn-press grid h-9 w-9 place-items-center rounded-xl border border-line hover:bg-line/50 disabled:opacity-30"
                            aria-label="Decrease stock"
                          >
                            {busy === `${product.id}--1` ? <Spinner size={13} /> : <Minus size={14} />}
                          </button>
                          <button
                            onClick={() => adjust(product, 1)}
                            disabled={busy === `${product.id}-1`}
                            className="btn-press grid h-9 w-9 place-items-center rounded-xl border border-line hover:bg-lime hover:text-ink hover:border-lime disabled:opacity-30"
                            aria-label="Increase stock"
                          >
                            {busy === `${product.id}-1` ? <Spinner size={13} /> : <Plus size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              const value = prompt(`Set stock for ${product.name}`, product.stock)
                              if (value === null) return
                              patch(`/api/admin/products/${product.id}/stock`, { stock: Number(value) })
                                .then((data) => setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product : p))))
                                .catch((err) => push(err.message, 'error'))
                            }}
                            className="btn-press rounded-xl border border-line px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-line/50"
                          >
                            Set
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">No products match this filter.</p>}
        </div>
      )}
    </div>
  )
}
