import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Percent, Copy } from 'lucide-react'
import { get, post, put, del } from '../lib/api'
import { useToast } from '../lib/toast'
import { inr } from '../lib/format'
import Modal from '../components/Modal'
import { Skeleton, Spinner } from '../components/Loader'
import { inputClass, Field, Button, EmptyState } from '../components/admin-ui'

const empty = { code: '', description: '', type: 'percent', value: '', min_order: 0, max_uses: 0, starts_at: '', ends_at: '', active: true }

export default function AdminDiscounts() {
  const { push } = useToast()
  const [discounts, setDiscounts] = useState(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = () => get('/api/admin/discounts').then((d) => setDiscounts(d.discounts)).catch((err) => push(err.message, 'error'))
  useEffect(() => { load() }, [])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const openNew = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit = (d) => {
    setEditing(d)
    setForm({
      ...d,
      starts_at: d.starts_at || '',
      ends_at: d.ends_at || '',
      active: !!d.active,
    })
    setModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      value: Number(form.value),
      min_order: Number(form.min_order),
      max_uses: Number(form.max_uses),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }
    try {
      if (editing) await put(`/api/admin/discounts/${editing.id}`, payload)
      else await post('/api/admin/discounts', payload)
      push(editing ? 'Discount updated' : `Code ${payload.code} created`)
      setModal(false)
      load()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (d) => {
    if (!confirm(`Delete discount "${d.code}"?`)) return
    setDeleting(d.id)
    try {
      await del(`/api/admin/discounts/${d.id}`)
      push('Discount deleted')
      load()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  const toggle = async (d) => {
    try {
      await put(`/api/admin/discounts/${d.id}`, { active: !d.active })
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Discounts</h1>
          <p className="mt-1 text-sm text-muted">Promo codes applied at checkout · usage tracked per code</p>
        </div>
        <Button onClick={openNew}><Plus size={15} /> New code</Button>
      </header>

      {!discounts ? (
        <Skeleton dark className="h-72 rounded-2xl" />
      ) : discounts.length === 0 ? (
        <EmptyState icon={<Percent size={22} />} title="No discount codes" subtitle="Create a code to run your next campaign." action={<Button onClick={openNew}>Create code</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {discounts.map((d, i) => {
            const expired = d.ends_at && new Date(d.ends_at) < new Date()
            const maxed = d.max_uses > 0 && d.used_count >= d.max_uses
            return (
              <article
                key={d.id}
                className={`group rounded-2xl border p-5 transition-all duration-400 hover:-translate-y-1 ${
                  d.active && !expired && !maxed ? 'border-lime/30 bg-gradient-to-br from-ink-2 to-ink-3' : 'border-line bg-ink-2 opacity-75'
                }`}
                style={{ animation: `fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-black uppercase tracking-tight text-lime">{d.code}</p>
                    <p className="mt-1 text-xs text-muted">{d.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { navigator.clipboard?.writeText(d.code); push('Code copied') }} className="grid h-8 w-8 place-items-center rounded-lg bg-line/50 hover:bg-line transition-colors" aria-label="Copy code">
                      <Copy size={12} />
                    </button>
                    <button onClick={() => openEdit(d)} className="grid h-8 w-8 place-items-center rounded-lg bg-line/50 hover:bg-lime hover:text-ink transition-colors" aria-label="Edit">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => remove(d)} disabled={deleting === d.id} className="grid h-8 w-8 place-items-center rounded-lg bg-line/50 hover:bg-flare transition-colors" aria-label="Delete">
                      {deleting === d.id ? <Spinner size={12} /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>

                <p className="mt-4 font-display text-3xl font-black">
                  {d.type === 'percent' ? `${d.value}%` : inr(d.value)}
                  <span className="ml-2 text-xs font-bold uppercase tracking-wider text-muted">off</span>
                </p>

                <dl className="mt-4 space-y-1.5 text-xs text-muted">
                  <div className="flex justify-between"><dt>Min order</dt><dd className="text-bone/80">{d.min_order > 0 ? inr(d.min_order) : 'None'}</dd></div>
                  <div className="flex justify-between"><dt>Usage</dt><dd className="text-bone/80">{d.used_count} / {d.max_uses === 0 ? '∞' : d.max_uses}</dd></div>
                  {d.ends_at && <div className="flex justify-between"><dt>Expires</dt><dd className={expired ? 'text-flare' : 'text-bone/80'}>{String(d.ends_at).slice(0, 10)}</dd></div>}
                </dl>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full bg-lime transition-all duration-700"
                    style={{ width: `${d.max_uses === 0 ? Math.min(100, d.used_count * 4) : Math.min(100, (d.used_count / d.max_uses) * 100)}%` }}
                  />
                </div>

                <button
                  onClick={() => toggle(d)}
                  className={`btn-press mt-4 w-full rounded-full border py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    d.active ? 'border-lime/40 text-lime hover:bg-lime/10' : 'border-line text-muted hover:bg-line/40'
                  }`}
                >
                  {d.active ? (expired ? 'Expired — click to reactivate' : 'Active — click to disable') : 'Disabled — click to enable'}
                </button>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit discount' : 'New discount'}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" required hint="e.g. FESTIVE25">
            <input required className={`${inputClass} uppercase`} value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
          </Field>
          <Field label="Type" required>
            <select className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="percent">Percent (%) off</option>
              <option value="fixed">Fixed ₹ off</option>
            </select>
          </Field>
          <Field label={form.type === 'percent' ? 'Percent off' : 'Amount off (₹)'} required>
            <input required type="number" min="0" step="0.01" className={inputClass} value={form.value} onChange={(e) => set('value', e.target.value)} />
          </Field>
          <Field label="Minimum order (₹)">
            <input type="number" min="0" className={inputClass} value={form.min_order} onChange={(e) => set('min_order', e.target.value)} />
          </Field>
          <Field label="Max uses" hint="0 = unlimited">
            <input type="number" min="0" className={inputClass} value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} />
          </Field>
          <Field label="Description">
            <input className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown at checkout" />
          </Field>
          <Field label="Starts at">
            <input type="datetime-local" className={inputClass} value={String(form.starts_at).slice(0, 16)} onChange={(e) => set('starts_at', e.target.value)} />
          </Field>
          <Field label="Ends at">
            <input type="datetime-local" className={inputClass} value={String(form.ends_at).slice(0, 16)} onChange={(e) => set('ends_at', e.target.value)} />
          </Field>
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3 text-sm cursor-pointer hover:border-lime/40 transition-colors">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-lime" />
            Code is live and can be used by customers
          </label>
          <div className="sm:col-span-2 mt-2 flex gap-3">
            <Button type="submit" loading={saving} className="flex-1 py-4">{editing ? 'Save changes' : 'Create code'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
