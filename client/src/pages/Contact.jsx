import { useState } from 'react'
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react'
import { post } from '../lib/api'
import { useToast } from '../lib/toast'
import { lightInputClass, Field, Button } from '../components/admin-ui'
import Reveal from '../components/Reveal'
import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL, EMAIL, SUPPORT_HOURS } from '../lib/contact'

const channels = [
  { icon: Phone, title: 'Helpline', lines: [PHONE_DISPLAY, SUPPORT_HOURS], href: `tel:${PHONE_TEL}` },
  { icon: MessageCircle, title: 'WhatsApp', lines: [PHONE_DISPLAY, 'Quick replies within 2 hours'], href: WHATSAPP_URL },
  { icon: Mail, title: 'Email', lines: [EMAIL, 'Response within 24 hours'], href: `mailto:${EMAIL}` },
  { icon: MapPin, title: 'Studio', lines: ['Unit 402, Veera Desai Road', 'Andheri West, Mumbai 400053'], href: null },
]

export default function Contact() {
  const { push } = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await post('/api/messages', form)
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
      push('Message sent — we will get back within 24 hours')
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime-2">Say hello</p>
        <h1 className="mt-2 font-display text-5xl sm:text-7xl font-black uppercase tracking-[-0.045em] leading-[0.9]">
          Contact us
        </h1>
        <p className="mt-4 text-ink/65 leading-relaxed">
          Collabs, bulk orders, press, or just want to talk fits — drop a message and a real human from the crew will reply.
        </p>
      </header>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel, i) => {
          const inner = (
            <div className="card-lift h-full rounded-2xl border border-ink/10 bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-lime/25 text-ink">
                <channel.icon size={19} />
              </span>
              <p className="mt-4 font-display text-base font-bold uppercase tracking-tight">{channel.title}</p>
              {channel.lines.map((line) => (
                <p key={line} className="mt-1 text-sm text-muted">{line}</p>
              ))}
            </div>
          )
          return channel.href ? (
            <a key={channel.title} href={channel.href} className="animate-fade-up block" style={{ animationDelay: `${i * 80}ms` }}>
              {inner}
            </a>
          ) : (
            <Reveal key={channel.title} delay={i * 80}>{inner}</Reveal>
          )
        })}
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <h2 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Drop a message</h2>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            For order issues, include your order ID (FC-XXXXXXXX) so we can move faster. For anything else, we're all ears.
          </p>
          <div className="mt-8 overflow-hidden rounded-3xl border border-ink/10">
            <img src="/img/contact-map.svg" alt="Fitcheck studio location" className="w-full" loading="lazy" />
          </div>
        </Reveal>

        <Reveal delay={100}>
          {sent ? (
            <div className="animate-scale-in rounded-3xl border border-lime/40 bg-lime/10 p-10 text-center">
              <p className="font-display text-3xl font-black uppercase tracking-tight">Message locked in ✓</p>
              <p className="mt-3 text-sm text-ink/70">We'll reply from {EMAIL} within 24 hours.</p>
              <button onClick={() => setSent(false)} className="btn-press mt-6 rounded-full border border-ink px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-bone">
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <input required className={lightInputClass} value={form.name} onChange={set('name')} placeholder="Your name" />
                </Field>
                <Field label="Email" required>
                  <input required type="email" className={lightInputClass} value={form.email} onChange={set('email')} placeholder="you@email.com" />
                </Field>
              </div>
              <Field label="Subject" required>
                <input required className={lightInputClass} value={form.subject} onChange={set('subject')} placeholder="What's this about?" />
              </Field>
              <Field label="Message" required>
                <textarea required rows={6} className={`${lightInputClass} resize-none`} value={form.message} onChange={set('message')} placeholder="Tell us everything…" />
              </Field>
              <Button type="submit" variant="dark" loading={loading} className="w-full py-4">
                {loading ? 'Sending…' : <>Send message <Send size={14} /></>}
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  )
}
