import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, ShoppingBag, X, Phone, Search, MapPin, User } from 'lucide-react'
import { useCart } from '../lib/cart'
import { useScrollY } from '../lib/hooks'
import { useLocationStore } from '../lib/location'
import { PHONE_DISPLAY, PHONE_TEL } from '../lib/contact'
import AuthModal from './AuthModal'

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?category=shirts', label: 'Shirts' },
  { to: '/shop?category=bottomwear', label: 'Bottomwear' },
  { to: '/track', label: 'Track Order' },
  { to: '/support', label: 'Support' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { count, setDrawerOpen } = useCart()
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const scrolled = useScrollY() > 24
  const routerLocation = useLocation()
  const { location, clear } = useLocationStore()

  useEffect(() => setOpen(false), [routerLocation.pathname, routerLocation.search])

  return (
    <>
      <div className="bg-ink text-bone text-[11px] uppercase tracking-[0.28em] overflow-hidden">
        <div className="marquee-track py-2">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={dup === 1}>
              <span>Free shipping over ₹1,999</span>
              <span className="text-lime">★</span>
              <span>New drop: Classic Street Shirt</span>
              <span className="text-lime">★</span>
              <span>Cash on delivery available pan-India</span>
              <span className="text-lime">★</span>
              <span>Made in India · Ships pan-India</span>
              <span className="text-lime">★</span>
            </div>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-500 ${
          scrolled ? 'bg-bone/90 backdrop-blur-xl border-ink/10 shadow-[0_10px_30px_-24px_rgba(10,10,10,0.5)]' : 'bg-bone border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <button className="md:hidden -ml-1 p-2 btn-press" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="font-display text-xl sm:text-2xl font-black uppercase tracking-[-0.04em] group">
            Fitcheck<span className="text-lime-2 group-hover:text-lime transition-colors">.</span>{' '}
            <span className="hidden sm:inline text-[11px] font-bold tracking-[0.3em] align-middle text-muted">IND</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[13px] font-semibold uppercase tracking-wider">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `link-underline transition-colors ${isActive && !link.to.includes('?') ? 'text-ink' : 'text-ink/70 hover:text-ink'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            {location && (
              <button
                onClick={clear}
                title="Change location"
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold btn-press hover:bg-ink hover:text-bone max-w-[190px]"
              >
                <MapPin size={13} className="shrink-0 text-lime-2" />
                <span className="truncate">{location.label}</span>
              </button>
            )}
            <a
              href={`tel:${PHONE_TEL}`}
              className="hidden xl:flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold btn-press hover:bg-ink hover:text-bone"
            >
              <Phone size={13} /> {PHONE_DISPLAY}
            </a>
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-press flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-bone"
              aria-label="Login"
            >
              <User size={14} />
              <span className="hidden sm:inline">Login</span>
            </button>
            <Link to="/shop" className="hidden sm:grid h-10 w-10 place-items-center rounded-full btn-press hover:bg-ink/5" aria-label="Search products">
              <Search size={19} />
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full btn-press hover:bg-ink/5"
              aria-label="Open bag"
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[10px] font-bold animate-pop">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'max-h-96' : 'max-h-0'}`}>
          <nav className="border-t border-ink/10 px-4 py-4 flex flex-col gap-1 bg-bone">
            {links.map((link, i) => (
              <NavLink
                key={link.label}
                to={link.to}
                className="animate-slide-right rounded-lg px-3 py-2.5 font-display text-lg font-bold uppercase tracking-tight hover:bg-ink hover:text-bone transition-colors"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
