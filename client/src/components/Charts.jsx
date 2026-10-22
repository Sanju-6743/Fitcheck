import { useMemo } from 'react'
import { shortInr } from '../lib/format'

export function AreaChart({ data, height = 200, stroke = '#c8ff00', fill = 'rgba(200,255,0,0.14)', valueKey = 'amount', label }) {
  const { path, area, points, max, min } = useMemo(() => {
    if (!data?.length) return { path: '', area: '', points: [], max: 0, min: 0 }
    const values = data.map((d) => Number(d[valueKey]) || 0)
    const max = Math.max(...values, 1)
    const min = 0
    const w = 100
    const h = 100
    const pts = values.map((v, i) => ({
      x: (i / Math.max(1, values.length - 1)) * w,
      y: h - ((v - min) / (max - min || 1)) * (h - 8) - 4,
      v,
      d: data[i],
    }))
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
    const area = `${path} L${w},100 L0,100 Z`
    return { path, area, points: pts, max, min }
  }, [data, valueKey])

  if (!data?.length) {
    return <div className="grid h-40 place-items-center text-sm text-muted">No data yet</div>
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-ink/8" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill={`url(#grad-${valueKey})`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.4" fill={stroke} opacity={0} className="hover:opacity-100 transition-opacity">
            <title>{p.d?.day}: {shortInr(p.v)}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{data[0]?.day?.slice(5)}</span>
        {label && <span>{label}</span>}
        <span>{data[data.length - 1]?.day?.slice(5)}</span>
      </div>
    </div>
  )
}

export function Donut({ segments, size = 150, thickness = 18, format = shortInr }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-ink/10" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const frac = seg.value / total
          const dash = frac * circumference
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
              strokeLinecap="butt"
            >
              <title>{seg.label}: {format(seg.value)}</title>
            </circle>
          )
          offset += dash
          return el
        })}
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((seg, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-muted">{seg.label}</span>
            <span className="ml-auto font-semibold tabular-nums">{format(seg.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Bars({ data, height = 140, valueKey = 'value', labelKey = 'label', color = '#c8ff00' }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end h-full">
          <div
            className="w-full rounded-t-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-80"
            style={{
              height: `${Math.max(4, ((Number(d[valueKey]) || 0) / max) * 100)}%`,
              background: d.color || color,
              animation: `fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms both`,
            }}
            title={`${d[labelKey]}: ${d.display ?? d[valueKey]}`}
          />
        </div>
      ))}
    </div>
  )
}
