import { useEffect, useState } from 'react'
import { ChevronDown, Phone, MessageCircle, Mail, LifeBuoy, Ticket, Search, CheckCircle2 } from 'lucide-react'
import { get, post } from '../lib/api'
import { useToast } from '../lib/toast'
import { lightInputClass, Field, Button, Pill } from '../components/admin-ui'
import Reveal from '../components/Reveal'
import { formatDateTime } from '../lib/format'
import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL, EMAIL, SUPPORT_HOURS } from '../lib/contact'

const faqs = [
  {
    q: 'How do I track my order?',
    a: 'Head to the Track Order page and enter your FC- order ID. You will see live payment status plus packing, shipping and delivery updates. It auto-refreshes while your order is in motion.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'UPI (GPay, PhonePe, Paytm), all major cards (Visa, Mastercard, RuPay) and Cash on Delivery across 19,000+ pin codes. Online payments show instant status in your order timeline.',
  },
  {
    q: 'What is the return and exchange policy?',
    a: '7-day easy returns and one free size exchange per order. Items must be unworn with tags attached. Raise a ticket below and we will send a reverse pickup link within 24 hours.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Mumbai dispatches are next-day; metro cities get it in 2–3 days; rest of India in 4–6 business days. Orders above ₹1,999 ship free.',
  },
  {
    q: 'Do you restock sold-out drops?',
    a: 'Almost never. Drops are limited runs — when a size sells out, it is gone. Join the newsletter for restock alerts just in case.',
  },
  {
    q: 'Do you offer bulk or college-fest orders?',
    a: 'Yes — orders above 40 units qualify for custom prints and bulk pricing. Email us or raise a ticket under "Collab / bulk".',
  },
]

const categories = [
  { value: 'order', label: 'Order issue' },
  { value: 'returns', label: 'Returns & exchanges' },
  { value: 'payments', label: 'Payments' },
  { value: 'product', label: 'Product question' },
  { value: 'partnership', label: 'Collab / bulk' },
  { value: 'general', label: 'General' },
]

export default function Support() {
  const { push } = useToast()
  const [openFaq, setOpenFaq] = useState(0)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: 'order', subject: '', message: '' })
  const [lookupCode, setLookupCode] = useState('')
  const [lookup, setLookup] = useState(null)
  const [lookupError, setLookupError] = useState(null)
  const [lookupBusy, setLookupBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  useEffect(() => {
    document.title = 'Support — Fitcheck India'
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await post('/api/tickets', form)
      setCreated(data.ticket_code)
      setForm({ name: '', email: '', phone: '', category: 'order', subject: '', message: '' })
      push(`Ticket ${data.ticket_code} created`)
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const lookupTicket = async (e) => {
    e.preventDefault()
    setLookupBusy(true)
    setLookupError(null)
    setLookup(null)
    try {
      const data = await get(`/api/tickets/${lookupCode.trim().toUpperCase()}`)
      setLookup(data)
    } catch (err) {
      setLookupError(err.message)
    } finally {
      setLookupBusy(false)
    }
  }

  return (
    <div className="page-enter">
      <section className="bg-ink text-bone grain relative overflow-hidden">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-sky/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime">Help centre</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl font-black uppercase leading-[0.92] tracking-[-0.045em]">
            We've got your back
          </h1>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Phone, title: 'Helpline', text: PHONE_DISPLAY, sub: SUPPORT_HOURS, href: `tel:${PHONE_TEL}` },
              { icon: MessageCircle, title: 'WhatsApp', text: PHONE_DISPLAY, sub: 'Replies in ~2 hours', href: WHATSAPP_URL },
              { icon: Mail, title: 'Email', text: EMAIL, sub: 'Response within 24 hours', href: `mailto:${EMAIL}` },
            ].map((card, i) => (
              <a
                key={card.title}
                href={card.href}
                className="animate-fade-up group rounded-2xl border border-bone/15 bg-bone/5 p-6 backdrop-blur transition-all duration-400 hover:border-lime hover:bg-lime/10"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <card.icon size={20} className="text-lime" />
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-bone/50">{card.title}</p>
                <p className="mt-1 font-display text-xl font-black uppercase tracking-tight">{card.text}</p>
                <p className="mt-1 text-xs text-bone/50">{card.sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div id="faq">
          <Reveal>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">FAQs</h2>
            <p className="mt-2 text-sm text-muted">Quick answers to the questions we get most.</p>
          </Reveal>
          <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {faqs.map((faq, i) => (
              <div key={faq.q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left group"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-display text-[15px] font-bold uppercase tracking-tight group-hover:text-lime-2 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${openFaq === i ? 'rotate-180 text-lime-2' : 'text-muted'}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-8 text-sm leading-relaxed text-ink/70">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div id="track-ticket" className="mt-12 rounded-2xl bg-bone-2/70 p-6">
            <h3 className="font-display text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Search size={17} /> Check ticket status
            </h3>
            <form onSubmit={lookupTicket} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                placeholder="TK-XXXXXXXX"
                className={`${lightInputClass} flex-1`}
                required
              />
              <Button type="submit" variant="dark" loading={lookupBusy}>Lookup</Button>
            </form>
            {lookupError && <p className="mt-3 text-sm text-flare">{lookupError}</p>}
            {lookup && (
              <div className="mt-4 animate-scale-in rounded-xl border border-ink/10 bg-white p-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display font-bold uppercase">{lookup.ticket.subject}</p>
                  <Pill status={lookup.ticket.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {lookup.ticket.ticket_code} · opened {formatDateTime(lookup.ticket.created_at)}
                </p>
                <ul className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                  {lookup.replies.map((reply) => (
                    <li key={reply.id} className={reply.author === 'staff' ? 'rounded-xl bg-lime/10 p-3' : 'rounded-xl bg-bone-2/60 p-3'}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                        {reply.author === 'staff' ? 'Fitcheck support' : lookup.ticket.name} · {formatDateTime(reply.created_at)}
                      </p>
                      <p className="mt-1 leading-relaxed">{reply.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div id="tickets">
          <Reveal delay={80}>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Raise a ticket</h2>
            <p className="mt-2 text-sm text-muted">Average first response: under 6 hours on weekdays.</p>
          </Reveal>

          {created ? (
            <div className="animate-scale-in mt-8 rounded-3xl border border-lime/40 bg-lime/10 p-8 text-center">
              <CheckCircle2 size={36} className="mx-auto text-lime-2" />
              <p className="mt-4 font-display text-2xl font-black uppercase tracking-tight">Ticket created</p>
              <p className="mt-2 text-sm text-ink/70">
                Your ticket code is <span className="font-bold">{created}</span>. Save it to check status anytime.
              </p>
              <button onClick={() => setCreated(null)} className="btn-press mt-6 rounded-full border border-ink px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-bone">
                Raise another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <input required className={lightInputClass} value={form.name} onChange={set('name')} placeholder="Your name" />
                </Field>
                <Field label="Email" required>
                  <input required type="email" className={lightInputClass} value={form.email} onChange={set('email')} placeholder="you@email.com" />
                </Field>
                <Field label="Phone">
                  <input className={lightInputClass} value={form.phone} onChange={set('phone')} placeholder="98200 12345" />
                </Field>
                <Field label="Category" required>
                  <select className={lightInputClass} value={form.category} onChange={set('category')}>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Subject" required>
                <input required className={lightInputClass} value={form.subject} onChange={set('subject')} placeholder="Short summary" />
              </Field>
              <Field label="What happened?" required>
                <textarea required rows={5} className={`${lightInputClass} resize-none`} value={form.message} onChange={set('message')} placeholder="Include your order ID if you have one…" />
              </Field>
              <Button type="submit" variant="dark" loading={loading} className="w-full py-4">
                {loading ? 'Submitting…' : <><Ticket size={14} /> Submit ticket</>}
              </Button>
            </form>
          )}

          <div className="mt-8 rounded-2xl border border-ink/10 bg-bone-2/60 p-6">
            <p className="flex items-center gap-2 font-display text-base font-black uppercase tracking-tight">
              <LifeBuoy size={17} /> Emergency helpline
            </p>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Stuck during a live drop or payment issue? Call <strong className="text-ink">{PHONE_DISPLAY}</strong> — our drop-day support desk stays open late when a new collection goes live.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
