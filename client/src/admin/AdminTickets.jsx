import { useCallback, useEffect, useState } from 'react'
import { Send, LifeBuoy } from 'lucide-react'
import { get, post, patch } from '../lib/api'
import { useToast } from '../lib/toast'
import { formatDateTime } from '../lib/format'
import { Skeleton } from '../components/Loader'
import { inputClass, Field, Button, Pill, EmptyState } from '../components/admin-ui'

const statuses = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
]

const categoryLabels = {
  order: 'Order issue',
  returns: 'Returns',
  payments: 'Payments',
  product: 'Product',
  partnership: 'Collab / bulk',
  general: 'General',
}

export default function AdminTickets() {
  const { push } = useToast()
  const [tickets, setTickets] = useState(null)
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [replies, setReplies] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    get(`/api/admin/tickets${status ? `?status=${status}` : ''}`)
      .then((d) => setTickets(d.tickets))
      .catch((err) => push(err.message, 'error'))
  }, [status, push])

  useEffect(() => { load() }, [load])

  const open = async (ticket) => {
    setSelected(ticket)
    try {
      const data = await get(`/api/admin/tickets/${ticket.id}`)
      setReplies(data.replies)
      setSelected(data.ticket)
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const send = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      const data = await post(`/api/admin/tickets/${selected.id}/replies`, { body, status: 'pending' })
      setReplies(data.replies)
      setSelected(data.ticket)
      setBody('')
      push('Reply sent to customer')
      load()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  const setStatusValue = async (next) => {
    try {
      const data = await patch(`/api/admin/tickets/${selected.id}`, { status: next })
      setSelected(data.ticket)
      push(`Ticket marked ${next}`)
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Support tickets</h1>
          <p className="mt-1 text-sm text-muted">Customer issues, replies and resolution tracking</p>
        </div>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`btn-press rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                status === s.value ? 'border-lime bg-lime text-ink' : 'border-line hover:bg-line/40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section>
          {!tickets ? (
            <Skeleton dark className="h-96 rounded-2xl" />
          ) : tickets.length === 0 ? (
            <EmptyState icon={<LifeBuoy size={22} />} title="Inbox zero" subtitle="No tickets match this filter." />
          ) : (
            <ul className="space-y-3">
              {tickets.map((ticket, i) => (
                <li key={ticket.id}>
                  <button
                    onClick={() => open(ticket)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      selected?.id === ticket.id ? 'border-lime bg-ink-3' : 'border-line bg-ink-2 hover:border-lime/40'
                    }`}
                    style={{ animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 40, 320)}ms both` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-sm font-bold uppercase leading-tight truncate">{ticket.subject}</p>
                      <Pill status={ticket.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      {ticket.ticket_code} · {categoryLabels[ticket.category] || ticket.category} · {ticket.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-bone/50">{ticket.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:sticky lg:top-24 h-max rounded-2xl border border-line bg-ink-2">
          {!selected ? (
            <div className="p-10 text-center text-sm text-muted">
              <LifeBuoy size={26} className="mx-auto mb-3 opacity-40" />
              Select a ticket to view the conversation
            </div>
          ) : (
            <>
              <header className="border-b border-line p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-black uppercase tracking-tight">{selected.subject}</h2>
                  <Pill status={selected.status} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {selected.ticket_code} · {selected.name} · {selected.email}
                  {selected.phone && ` · ${selected.phone}`}
                </p>
                <p className="text-xs text-muted">Opened {formatDateTime(selected.created_at)}</p>
                <div className="mt-3 flex gap-2">
                  {['open', 'pending', 'resolved'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusValue(s)}
                      disabled={selected.status === s}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        selected.status === s ? 'border-lime bg-lime/15 text-lime' : 'border-line text-muted hover:text-bone'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </header>

              <div className="max-h-[420px] space-y-3 overflow-y-auto dark-scroll p-5">
                {replies.map((reply, i) => (
                  <div
                    key={reply.id}
                    className={`animate-fade-up rounded-xl p-3.5 text-sm ${
                      reply.author === 'staff' ? 'ml-6 bg-lime/10 border border-lime/20' : 'mr-6 bg-ink border border-line'
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                      {reply.author === 'staff' ? 'You · support' : selected.name} · {formatDateTime(reply.created_at)}
                    </p>
                    <p className="mt-1.5 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={send} className="border-t border-line p-5 space-y-3">
                <Field label="Reply to customer">
                  <textarea
                    rows={3}
                    className={`${inputClass} resize-none`}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your reply…"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" loading={sending}>
                    {sending ? 'Sending…' : <><Send size={13} /> Send reply</>}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
