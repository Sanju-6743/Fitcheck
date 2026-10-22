import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Phone, Mail } from 'lucide-react'
import { PHONE_DISPLAY, EMAIL, SUPPORT_HOURS } from '../lib/contact'

export default function Track() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    if (!code.trim()) return
    const query = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''
    navigate(`/order/${code.trim().toUpperCase()}${query}`)
  }

  return (
    <div className="page-enter">
      <section className="bg-ink text-bone grain relative overflow-hidden">
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-lime/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime">Live tracking</p>
          <h1 className="mt-3 font-display text-4xl sm:text-6xl font-black uppercase leading-[0.95] tracking-[-0.045em]">
            Where's my fit?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-bone/60 text-sm">
            Enter your order ID (starts with FC-) to see real-time payment and delivery status.
          </p>

          <form onSubmit={submit} className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FC-XXXXXXXX"
              className="w-full rounded-full border border-bone/20 bg-bone/5 px-6 py-4 text-sm uppercase tracking-wider text-bone placeholder:text-bone/35 outline-none focus:border-lime transition-colors"
              required
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email (optional)"
              className="w-full rounded-full border border-bone/20 bg-bone/5 px-6 py-4 text-sm text-bone placeholder:text-bone/35 outline-none focus:border-lime transition-colors sm:max-w-[220px]"
            />
            <button className="btn-press shine shrink-0 rounded-full bg-lime px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-ink hover:bg-bone">
              <Search size={16} className="inline mr-1 -mt-0.5" /> Track
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: MapPin, title: 'Dispatched from', text: 'Fitcheck Studio, Andheri East, Mumbai' },
            { icon: Phone, title: 'Delivery helpline', text: `${PHONE_DISPLAY} · ${SUPPORT_HOURS}` },
            { icon: Mail, title: 'Email support', text: `${EMAIL} · 24h response` },
          ].map((card, i) => (
            <div key={card.title} className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-6" style={{ animationDelay: `${i * 90}ms` }}>
              <card.icon size={20} className="text-lime-2" />
              <p className="mt-4 font-display text-sm font-bold uppercase tracking-tight">{card.title}</p>
              <p className="mt-1 text-sm text-muted">{card.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-bone-2/70 p-8 text-center">
          <p className="font-display text-xl font-black uppercase tracking-tight">Lost your order ID?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            It's in your confirmation email, or the support team can look it up via your phone number.
          </p>
          <a href="/support" className="btn-press mt-6 inline-block rounded-full bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-bone hover:bg-lime hover:text-ink">
            Contact support
          </a>
        </div>
      </section>
    </div>
  )
}
