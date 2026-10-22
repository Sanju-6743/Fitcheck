import { useEffect, useState } from 'react'
import { Inbox, Mail, Trash2 } from 'lucide-react'
import { get, patch, del } from '../lib/api'
import { useToast } from '../lib/toast'
import { formatDateTime } from '../lib/format'
import { Skeleton, Spinner } from '../components/Loader'
import { EmptyState, Pill } from '../components/admin-ui'

export default function AdminMessages() {
  const { push } = useToast()
  const [messages, setMessages] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = () => get('/api/admin/messages').then((d) => setMessages(d.messages)).catch((err) => push(err.message, 'error'))
  useEffect(() => { load() }, [])

  const mark = async (message, status) => {
    try {
      await patch(`/api/admin/messages/${message.id}`, { status })
      load()
      setSelected((prev) => (prev?.id === message.id ? { ...prev, status } : prev))
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const remove = async (message) => {
    if (!confirm('Delete this message?')) return
    try {
      await del(`/api/admin/messages/${message.id}`)
      push('Message deleted')
      setSelected(null)
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const open = (message) => {
    setSelected(message)
    if (message.status === 'new') mark(message, 'read')
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Inbox</h1>
        <p className="mt-1 text-sm text-muted">Messages from the contact form</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section>
          {!messages ? (
            <Skeleton dark className="h-96 rounded-2xl" />
          ) : messages.length === 0 ? (
            <EmptyState icon={<Inbox size={22} />} title="Inbox empty" subtitle="Contact-form messages land here." />
          ) : (
            <ul className="space-y-3">
              {messages.map((message, i) => (
                <li key={message.id}>
                  <button
                    onClick={() => open(message)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      selected?.id === message.id ? 'border-lime bg-ink-3' : 'border-line bg-ink-2 hover:border-lime/40'
                    }`}
                    style={{ animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 45, 350)}ms both` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-sm font-bold uppercase truncate">{message.subject}</p>
                      <Pill status={message.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      {message.name} · {message.email} · {formatDateTime(message.created_at)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-bone/50">{message.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:sticky lg:top-24 h-max rounded-2xl border border-line bg-ink-2">
          {!selected ? (
            <div className="p-10 text-center text-sm text-muted">
              <Mail size={26} className="mx-auto mb-3 opacity-40" />
              Select a message to read it
            </div>
          ) : (
            <>
              <header className="border-b border-line p-5">
                <h2 className="font-display text-lg font-black uppercase tracking-tight">{selected.subject}</h2>
                <p className="mt-1.5 text-xs text-muted">
                  From <span className="text-bone/80">{selected.name}</span> · {selected.email}
                </p>
                <p className="text-xs text-muted">{formatDateTime(selected.created_at)}</p>
              </header>
              <div className="p-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-bone/85">{selected.message}</p>
              </div>
              <footer className="flex flex-wrap gap-2 border-t border-line p-5">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="btn-press rounded-full bg-lime px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-ink hover:bg-bone"
                >
                  Reply via email
                </a>
                {selected.status !== 'replied' && (
                  <button onClick={() => mark(selected, 'replied')} className="btn-press rounded-full border border-line px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-line/50">
                    Mark replied
                  </button>
                )}
                <button
                  onClick={() => remove(selected)}
                  className="btn-press ml-auto grid h-10 w-10 place-items-center rounded-full border border-flare/40 text-flare hover:bg-flare hover:text-bone"
                  aria-label="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
