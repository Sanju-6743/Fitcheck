import { Link } from 'react-router-dom'
import { Instagram, Youtube, MessageCircle, Mail } from 'lucide-react'
import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL, EMAIL } from '../lib/contact'

const columns = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'All products' },
      { to: '/shop?category=tees', label: 'Tees' },
      { to: '/shop?category=hoodies', label: 'Hoodies & crews' },
      { to: '/shop?category=bottomwear', label: 'Bottomwear' },
      { to: '/shop?category=outerwear', label: 'Outerwear' },
      { to: '/shop?category=accessories', label: 'Accessories' },
    ],
  },
  {
    title: 'Help',
    links: [
      { to: '/support', label: 'Help centre' },
      { to: '/support#tickets', label: 'Raise a ticket' },
      { to: '/track', label: 'Track your order' },
      { to: '/contact', label: 'Contact us' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-bone">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="font-display text-3xl font-black uppercase tracking-[-0.04em]">
              Fitcheck<span className="text-lime">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/60">
              High-performance streetwear built for Indian streets. Heavyweight fabrics, limited drops, zero boring fits.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Youtube, MessageCircle, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href={i === 2 ? WHATSAPP_URL : i === 3 ? `mailto:${EMAIL}` : '#'}
                  className="grid h-10 w-10 place-items-center rounded-full border border-bone/15 btn-press hover:bg-lime hover:text-ink hover:border-lime"
                  aria-label="Social"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime">{col.title}</p>
              <ul className="mt-5 space-y-3 text-sm text-bone/70">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="link-underline hover:text-bone transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime">Helpline</p>
            <ul className="mt-5 space-y-3 text-sm text-bone/70">
              <li>
                <a href={`tel:${PHONE_TEL}`} className="link-underline hover:text-bone">{PHONE_DISPLAY}</a>
              </li>
              <li>
                <a href={WHATSAPP_URL} className="link-underline hover:text-bone">WhatsApp: {PHONE_DISPLAY}</a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="link-underline hover:text-bone">{EMAIL}</a>
              </li>
              <li className="pt-2 text-bone/50">Mon–Sat · 10:00–19:00 IST</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-bone/10 pt-6 text-xs text-bone/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Fitcheck India. All rights reserved.</p>
          <p>UPI · Cards · COD · Simulated gateway for demo</p>
        </div>
      </div>
    </footer>
  )
}
