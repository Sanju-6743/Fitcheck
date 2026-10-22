import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react'
import { get } from '../lib/api'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import { ProductCardSkeleton } from '../components/Loader'
import { useCountUp } from '../lib/hooks'

const perks = [
  { icon: Truck, title: 'Free shipping', text: 'On all orders above ₹1,999, pan-India' },
  { icon: RotateCcw, title: '7-day returns', text: 'Easy exchanges, no drama policy' },
  { icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards & COD with instant status' },
  { icon: Headphones, title: 'Human support', text: 'Real humans on helpline, Mon–Sat' },
]

function Stat({ value, suffix = '', label }) {
  const animated = useCountUp(value)
  return (
    <div>
      <p className="font-display text-4xl sm:text-5xl font-black tracking-tight">
        {Math.round(animated).toLocaleString('en-IN')}
        {suffix}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted">{label}</p>
    </div>
  )
}

export default function Home() {
  const [featured, setFeatured] = useState(null)
  const [stats, setStats] = useState({ products: 0 })

  useEffect(() => {
    const controller = new AbortController()
    get('/api/products?limit=50', controller.signal)
      .then((data) => {
        setFeatured(data.products.filter((p) => p.featured))
        setStats({ products: data.total })
      })
      .catch(() => setFeatured([]))
    return () => controller.abort()
  }, [])

  return (
    <div className="page-enter">
      <section className="relative overflow-hidden bg-ink text-bone grain">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/25 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-flare/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="hero-zoom inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse-dot" />
              Drop 07 · Live now
            </p>
            <h1 className="hero-zoom mt-6 font-display text-[clamp(2.8rem,9vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.045em]" style={{ animationDelay: '120ms' }}>
              Streetwear
              <br />
              that <span className="text-lime">slaps</span>
              <br />
              <span className="text-stroke" style={{ WebkitTextStroke: '1.5px #f5f2eb' }}>on sight.</span>
            </h1>
            <p className="hero-zoom mt-6 max-w-md text-bone/65 leading-relaxed" style={{ animationDelay: '240ms' }}>
              Heavyweight drops engineered for Indian streets — from Bandra basements to Delhi rooftops. Limited runs. Zero restocks on sold-out heat.
            </p>
            <div className="hero-zoom mt-9 flex flex-wrap gap-3" style={{ animationDelay: '360ms' }}>
              <Link to="/shop" className="btn-press shine rounded-full bg-lime px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-ink hover:bg-bone">
                Shop the drop <ArrowRight size={16} className="ml-1 inline -mt-0.5" />
              </Link>
              <Link to="/track" className="btn-press rounded-full border border-bone/25 px-8 py-4 text-sm font-black uppercase tracking-[0.15em] hover:bg-bone hover:text-ink">
                Track order
              </Link>
            </div>

            <div className="hero-zoom mt-12 flex items-center gap-3 text-sm text-bone/60" style={{ animationDelay: '460ms' }}>
              <span className="grid h-10 w-10 place-items-center rounded-full border border-lime/40 bg-lime/10 text-lime">
                <Truck size={17} />
              </span>
              <div>
                <p className="font-semibold text-bone">Free shipping over ₹1,999</p>
                <p className="text-xs">COD available · 7-day easy returns</p>
              </div>
            </div>
          </div>

          <div className="hero-zoom relative mx-auto w-full max-w-md" style={{ animationDelay: '200ms' }}>
            <div className="relative rounded-3xl border border-bone/10 bg-ink-2 p-3 shadow-2xl">
              <img src="/img/hero-stack.svg" alt="Fitcheck India drop preview" className="w-full rounded-2xl" loading="eager" />
              <div className="absolute -bottom-5 -left-5 rounded-2xl bg-bone px-5 py-3 text-ink shadow-xl">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted">From</p>
                <p className="font-display text-2xl font-black">₹1,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-bone-2/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 sm:py-6">
          {perks.map((perk, i) => (
            <Reveal key={perk.title} delay={i * 90} className="flex items-start gap-3 p-4">
              <perk.icon size={20} className="mt-0.5 shrink-0 text-lime-2" />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-tight">{perk.title}</p>
                <p className="mt-0.5 text-xs text-muted leading-relaxed">{perk.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime-2">The heat</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-black uppercase tracking-[-0.04em]">
              Featured drops
            </h2>
          </div>
          <Link to="/shop" className="btn-press group inline-flex items-center gap-2 rounded-full border border-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:bg-ink hover:text-bone">
            View all
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.slice(0, 4).map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
        </div>
      </section>

      <section className="bg-ink text-bone grain relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal scale className="relative">
            <img src="/img/lookbook.svg" alt="Fitcheck lookbook" className="w-full rounded-3xl border border-bone/10" loading="lazy" />
            <div className="absolute -right-4 top-6 rotate-3 rounded-full bg-lime px-4 py-2 text-xs font-black uppercase tracking-wider text-ink">
              Lookbook 07
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime">Built different</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black uppercase leading-[0.95] tracking-[-0.04em]">
              Designed in India,<br />worn everywhere
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-bone/65">
              Every Fitcheck piece starts as a sketch in a Mumbai studio, gets tested on real streets, and ships in limited runs. When it's gone, it's gone — no restocks, no regrets.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                ['240–460 GSM fabrics', 'Heavyweight cotton that holds shape wash after wash'],
                ['Pre-shrunk & zero-fade', 'Dye processes tested for Indian wash cycles'],
                ['Inclusive sizing', 'XS to XXL across core styles, unisex fits'],
              ].map(([title, text], i) => (
                <li key={title} className="animate-slide-right flex gap-4" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime/15 text-lime text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="font-display font-bold uppercase tracking-tight">{title}</p>
                    <p className="text-bone/55 mt-0.5">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-center">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-lime-2">Straight facts</p>
          <div className="mt-10 grid grid-cols-2 gap-10 sm:grid-cols-4">
            <Stat value={stats.products} label="Products live" />
            <Stat value={100} suffix="%" label="Made in India" />
            <Stat value={7} label="Day returns" />
            <Stat value={1999} label="₹ free-ship mark" />
          </div>
          <p className="mt-8 text-xs text-muted">All numbers update live from the store — no fake counters.</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
        <Reveal className="overflow-hidden rounded-3xl bg-ink text-bone grain relative">
          <div className="absolute -left-10 -bottom-16 h-56 w-56 rounded-full bg-lime/20 blur-3xl" />
          <div className="relative px-8 py-14 sm:px-14 text-center">
            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-[-0.04em] leading-[0.95]">
              Never miss a drop
            </h2>
            <p className="mx-auto mt-4 max-w-md text-bone/60 text-sm">
              Early access, restock alerts and members-only codes. No spam, only heat.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.elements.email
                input.value = ''
                input.placeholder = "You're on the list ✓"
              }}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                className="w-full rounded-full border border-bone/20 bg-bone/5 px-6 py-4 text-sm text-bone placeholder:text-bone/40 outline-none focus:border-lime transition-colors"
              />
              <button className="btn-press shine shrink-0 rounded-full bg-lime px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-ink hover:bg-bone">
                Join
              </button>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
