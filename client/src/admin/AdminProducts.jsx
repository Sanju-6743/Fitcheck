import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Star, EyeOff, Package } from 'lucide-react'
import { get, post, put, del } from '../lib/api'
import { useToast } from '../lib/toast'
import { inr } from '../lib/format'
import Modal from '../components/Modal'
import { Skeleton, Spinner } from '../components/Loader'
import { inputClass, Field, Button, EmptyState } from '../components/admin-ui'

const empty = {
  name: '', description: '', category: 'tees', price: '', compare_at_price: '', stock: 0,
  low_stock_threshold: 8, image: '', sizes: 'S, M, L, XL', featured: false, active: true,
}

export default function AdminProducts() {
  const { push } = useToast()
  const [products, setProducts] = useState(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = () =>
    get('/api/admin/products')
      .then((d) => setProducts(d.products))
      .catch((err) => push(err.message, 'error'))

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!products) return null
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.slug.includes(q))
  }, [products, search])

  const openNew = () => {
    setEditing(null)
    setForm(empty)
    setModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      ...product,
      price: product.price,
      compare_at_price: product.compare_at_price ?? '',
      sizes: (product.sizes || []).join(', '),
      featured: product.featured,
      active: product.active,
    })
    setModal(true)
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      compare_at_price: form.compare_at_price === '' ? null : Number(form.compare_at_price),
      stock: Number(form.stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      sizes: String(form.sizes)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    try {
      if (editing) await put(`/api/admin/products/${editing.id}`, payload)
      else await post('/api/admin/products', payload)
      push(editing ? 'Product updated' : 'Product created')
      setModal(false)
      load()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (product) => {
    if (!confirm(`Delete "${product.name}" permanently?`)) return
    setDeleting(product.id)
    try {
      await del(`/api/admin/products/${product.id}`)
      push('Product deleted')
      load()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Products</h1>
          <p className="mt-1 text-sm text-muted">{filtered?.length ?? '—'} SKUs · full CRUD</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-56 rounded-full border border-line bg-ink-2 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-lime transition-colors"
            />
          </div>
          <Button onClick={openNew}><Plus size={15} /> New product</Button>
        </div>
      </header>

      {!filtered ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} dark className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package size={22} />} title="No products" subtitle="Create your first product to start selling." action={<Button onClick={openNew}>Add product</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product, i) => (
            <article
              key={product.id}
              className="group rounded-2xl border border-line bg-ink-2 overflow-hidden transition-all duration-400 hover:border-lime/40 hover:-translate-y-1"
              style={{ animation: `fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 50, 400)}ms both` }}
            >
              <div className="flex gap-4 p-4">
                <img src={product.image || '/img/products/placeholder.svg'} alt="" className="h-24 w-20 rounded-xl object-cover bg-ink-3" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-bold uppercase leading-tight truncate">{product.name}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(product)} className="grid h-8 w-8 place-items-center rounded-lg bg-line/50 hover:bg-lime hover:text-ink transition-colors" aria-label="Edit">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(product)}
                        disabled={deleting === product.id}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-line/50 hover:bg-flare hover:text-bone transition-colors disabled:opacity-50"
                        aria-label="Delete"
                      >
                        {deleting === product.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted">{product.category}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-display font-black">{inr(product.price)}</span>
                    {product.compare_at_price > product.price && (
                      <span className="text-xs text-muted line-through">{inr(product.compare_at_price)}</span>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      product.stock === 0 ? 'bg-flare/15 text-flare' : product.stock <= product.low_stock_threshold ? 'bg-amber-400/15 text-amber-300' : 'bg-lime/15 text-lime'
                    }`}>
                      {product.stock} in stock
                    </span>
                    {product.featured && (
                      <span className="flex items-center gap-1 rounded-full bg-sky/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky">
                        <Star size={9} fill="currentColor" /> Featured
                      </span>
                    )}
                    {!product.active && (
                      <span className="flex items-center gap-1 rounded-full bg-bone/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone/60">
                        <EyeOff size={9} /> Hidden
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit product' : 'New product'} wide>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input required className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Category" required>
            <input required list="categories" className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)} />
            <datalist id="categories">
              {['shirts', 'bottomwear', 'tees', 'hoodies', 'outerwear', 'accessories'].map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="Description">
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="space-y-4">
            <Field label="Price (₹)" required>
              <input required type="number" min="0" step="1" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} />
            </Field>
            <Field label="Compare-at price (₹)" hint="Shown struck-through for discount badge">
              <input type="number" min="0" step="1" className={inputClass} value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} />
            </Field>
          </div>
          <Field label="Stock" required>
            <input required type="number" min="0" className={inputClass} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          </Field>
          <Field label="Low-stock alert at">
            <input type="number" min="0" className={inputClass} value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} />
          </Field>
          <Field label="Image path or URL" hint="e.g. /img/products/tee.svg">
            <input className={inputClass} value={form.image} onChange={(e) => set('image', e.target.value)} />
          </Field>
          <Field label="Sizes" hint="Comma separated">
            <input className={inputClass} value={form.sizes} onChange={(e) => set('sizes', e.target.value)} />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3 text-sm cursor-pointer hover:border-lime/40 transition-colors">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-lime" />
            Featured on homepage
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3 text-sm cursor-pointer hover:border-lime/40 transition-colors">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-lime" />
            Visible in store
          </label>
          <div className="sm:col-span-2 mt-2 flex gap-3">
            <Button type="submit" loading={saving} className="flex-1 py-4">{editing ? 'Save changes' : 'Create product'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
