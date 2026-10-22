import { useEffect, useState } from 'react'
import { Download, TrendingUp, TrendingDown, Wallet, Banknote } from 'lucide-react'
import { get } from '../lib/api'
import { inr, shortInr, formatDateTime, METHOD_LABELS } from '../lib/format'
import { AreaChart, Bars } from '../components/Charts'
import { Skeleton } from '../components/Loader'
import { EmptyState } from '../components/admin-ui'

const ranges = [
  { days: 7, label: '7D' },
  { days: 14, label: '14D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
]

const eventColors = {
  charge: '#c8ff00',
  cod_settlement: '#6ecbff',
  refund: '#ff4d24',
  charge_failed: '#fbbf24',
}

export default function AdminCashflow() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null)
    get(`/api/admin/cashflow?days=${days}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [days])

  if (error) return <p className="rounded-2xl border border-flare/40 bg-flare/10 p-6 text-flare">{error}</p>
  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton dark className="h-28 rounded-2xl" />
        <Skeleton dark className="h-96 rounded-2xl" />
      </div>
    )
  }

  const { summary, series, byMethod, ledger, pendingCod } = data

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">Cash flow</h1>
          <p className="mt-1 text-sm text-muted">Live ledger of captures, refunds and COD settlements</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-line p-1">
            {ranges.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`btn-press rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  days === r.days ? 'bg-lime text-ink' : 'text-muted hover:text-bone'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <a
            href="/api/admin/cashflow/export"
            className="btn-press inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-line/50"
          >
            <Download size={13} /> Export CSV
          </a>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { icon: Wallet, label: 'Net cash flow', value: shortInr(summary.net), cls: 'text-lime', accent: 'bg-lime/15 text-lime' },
          { icon: TrendingUp, label: 'Total inflow', value: shortInr(summary.inflow), accent: 'bg-sky/15 text-sky' },
          { icon: TrendingDown, label: 'Refunds paid', value: shortInr(summary.refunds), accent: 'bg-flare/15 text-flare' },
          { icon: Banknote, label: 'COD pending', value: shortInr(pendingCod.amount), accent: 'bg-amber-400/15 text-amber-300' },
          { icon: Wallet, label: 'Ledger events', value: summary.events, accent: 'bg-bone/10 text-bone/70' },
        ].map((kpi, i) => (
          <div key={kpi.label} className="rounded-2xl border border-line bg-ink-2 p-5 hover:-translate-y-1 transition-all duration-400" style={{ animation: `fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{kpi.label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpi.accent}`}><kpi.icon size={16} /></span>
            </div>
            <p className={`mt-3 font-display text-3xl font-black tracking-tight ${kpi.cls || ''}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-ink-2 p-6 xl:col-span-2">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">Net movement · {days} days</h2>
          <p className="text-xs text-muted mt-0.5">Inflow minus refunds per day</p>
          <div className="mt-6">
            <AreaChart data={series} valueKey="net" height={240} label="net" />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-ink-2 p-6">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">By method</h2>
          {byMethod.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No payment activity in this window.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {byMethod.map((m) => {
                const max = Math.max(...byMethod.map((x) => x.inflow), 1)
                return (
                  <li key={m.method}>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{METHOD_LABELS[m.method] || m.method}</span>
                      <span className="tabular-nums font-semibold">{shortInr(m.inflow)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lime to-lime-2 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ width: `${(m.inflow / max) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted">
                      {m.events} events{m.refunds > 0 && <> · {inr(m.refunds)} refunded</>}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-8 rounded-xl border border-line bg-ink p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Split check</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted text-xs">Card + UPI sales</p>
                <p className="font-display text-xl font-black text-lime">{shortInr(summary.card_upi_sales)}</p>
              </div>
              <div>
                <p className="text-muted text-xs">COD settled</p>
                <p className="font-display text-xl font-black text-sky">{shortInr(summary.cod_settled)}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-ink-2 overflow-hidden">
        <header className="border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">Transaction ledger</h2>
          <p className="text-xs text-muted mt-0.5">Every payment event, newest first · last {days} days</p>
        </header>
        {ledger.length === 0 ? (
          <EmptyState icon={<Wallet size={22} />} title="No transactions" subtitle="Ledger entries appear as soon as payments are captured." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                  <th className="px-6 py-3 font-bold">When</th>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Event</th>
                  <th className="px-4 py-3 font-bold">Method</th>
                  <th className="px-6 py-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 100).map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-b border-line/60 last:border-0 hover:bg-line/20 transition-colors"
                    style={{ animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 22, 280)}ms both` }}
                  >
                    <td className="px-6 py-3 text-xs text-muted whitespace-nowrap">{formatDateTime(entry.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-lime">{entry.order_code}</td>
                    <td className="px-4 py-3 text-bone/70">{entry.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full" style={{ background: eventColors[entry.event] || '#a3a39a' }} />
                        {entry.event.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bone/60 text-xs uppercase">{METHOD_LABELS[entry.method] || entry.method}</td>
                    <td className={`px-6 py-3 text-right font-semibold tabular-nums ${entry.amount < 0 ? 'text-flare' : entry.event === 'charge_failed' ? 'text-muted line-through' : 'text-lime'}`}>
                      {entry.amount < 0 ? '−' : ''}{inr(Math.abs(entry.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
