import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Receipt, Package, AlertTriangle, Wallet, ArrowRight } from 'lucide-react'
import { get } from '../lib/api'
import { shortInr, inr, timeAgo } from '../lib/format'
import { AreaChart, Donut } from '../components/Charts'
import { Skeleton } from '../components/Loader'
import { Pill } from '../components/admin-ui'

const segmentColors = {
  paid: '#c8ff00',
  pending: '#fbbf24',
  failed: '#ff4d24',
  refunded: '#6ecbff',
  cod_pending: '#a3a39a',
}

function KpiCard({ icon: Icon, label, value, accent, delay }) {
  return (
    <div
      className="rounded-2xl border border-line bg-ink-2 p-5 transition-all duration-400 hover:border-lime/40 hover:-translate-y-1"
      style={{ animation: `fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${accent}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-black tracking-tight">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    get('/api/admin/stats')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="rounded-2xl border border-flare/40 bg-flare/10 p-6 text-flare">{error}</p>
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} dark className="h-32 rounded-2xl" />)}
        <Skeleton dark className="h-80 rounded-2xl sm:col-span-2" />
        <Skeleton dark className="h-80 rounded-2xl" />
      </div>
    )
  }

  const { kpis, series, paymentBreakdown, topProducts, recentOrders, lowStock } = data
  const breakdownSegments = paymentBreakdown.map((p) => ({
    label: p.payment_status.replace('_', ' '),
    value: p.count,
    color: segmentColors[p.payment_status] || '#a3a39a',
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Wallet} label="Net cash flow" value={shortInr(kpis.net)} accent="bg-lime/15 text-lime" delay={0} />
        <KpiCard icon={TrendingUp} label="Gross revenue" value={shortInr(kpis.revenue)} accent="bg-sky/15 text-sky" delay={70} />
        <KpiCard icon={Receipt} label="Orders" value={kpis.orders} accent="bg-amber-400/15 text-amber-300" delay={140} />
        <KpiCard icon={AlertTriangle} label="Low stock SKUs" value={kpis.low_stock} accent="bg-flare/15 text-flare" delay={210} />
        <KpiCard icon={Package} label="Open tickets" value={kpis.open_tickets} accent="bg-bone/10 text-bone/80" delay={280} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-ink-2 p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-tight">Revenue · last 14 days</h2>
              <p className="text-xs text-muted mt-0.5">{shortInr(series.reduce((s, d) => s + d.amount, 0))} captured</p>
            </div>
            <Link to="/admin/cashflow" className="btn-press flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-line/50">
              Full report <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-6">
            <AreaChart data={series} height={230} label="revenue" />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-ink-2 p-6">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">Payment statuses</h2>
          <div className="mt-6 flex justify-center">
            <Donut segments={breakdownSegments} format={(v) => `${v} orders`} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-ink-3 p-3">
              <p className="text-muted">Awaiting payment</p>
              <p className="mt-1 font-display text-xl font-black text-amber-300">{kpis.pending_payments}</p>
            </div>
            <div className="rounded-xl bg-ink-3 p-3">
              <p className="text-muted">COD to collect</p>
              <p className="mt-1 font-display text-xl font-black">{kpis.cod_pending}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-ink-2 overflow-hidden xl:col-span-2">
          <header className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Recent orders</h2>
            <Link to="/admin/orders" className="text-[11px] font-bold uppercase tracking-wider text-lime hover:underline">
              View all
            </Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                  <th className="px-6 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">When</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-line/60 last:border-0 hover:bg-line/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link to={`/admin/orders?focus=${order.id}`} className="font-semibold text-lime hover:underline">
                        {order.order_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-bone/75">{order.customer_name}</td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">{inr(order.total)}</td>
                    <td className="px-4 py-3.5"><Pill status={order.payment_status} /></td>
                    <td className="px-4 py-3.5 text-xs text-muted">{timeAgo(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-ink-2 p-6">
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Top products</h2>
            <ul className="mt-5 space-y-3.5">
              {topProducts.length === 0 && <li className="text-sm text-muted">No sales yet</li>}
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime/15 text-lime text-xs font-black">{i + 1}</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-muted text-xs">{p.units} pcs</span>
                  <span className="font-semibold tabular-nums">{shortInr(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-ink-2 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">Low stock</h2>
              <Link to="/admin/inventory" className="text-[11px] font-bold uppercase tracking-wider text-lime hover:underline">Manage</Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="mt-4 text-sm text-muted">All SKUs healthy ✓</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-10 w-9 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className={`text-xs ${p.stock <= 3 ? 'text-flare' : 'text-amber-300'}`}>
                        {p.stock} left · reorder at {p.low_stock_threshold}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
