import { Spinner } from './Loader'

export const inputClass =
  'w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-muted/70 outline-none transition-all duration-300 focus:border-lime focus:ring-2 focus:ring-lime/25'

export const lightInputClass =
  'w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted outline-none transition-all duration-300 focus:border-ink focus:ring-2 focus:ring-ink/10'

export function Field({ label, hint, children, required }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
        {label} {required && <span className="text-flare">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Button({ children, variant = 'primary', loading, className = '', ...rest }) {
  const variants = {
    primary: 'bg-lime text-ink hover:bg-bone',
    dark: 'bg-ink text-bone hover:bg-lime hover:text-ink',
    ghost: 'border border-line text-bone hover:bg-line/50',
    light: 'border border-ink/20 text-ink hover:bg-ink hover:text-bone',
    danger: 'bg-flare/15 text-flare border border-flare/40 hover:bg-flare hover:text-bone',
  }
  return (
    <button
      className={`btn-press shine inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  )
}

const pillMap = {
  pending: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  paid: 'bg-lime/15 text-lime border-lime/30',
  failed: 'bg-flare/15 text-flare border-flare/30',
  refunded: 'bg-sky/15 text-sky border-sky/30',
  cod_pending: 'bg-bone/10 text-bone/80 border-bone/20',
  processing: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  shipped: 'bg-sky/15 text-sky border-sky/30',
  delivered: 'bg-lime/15 text-lime border-lime/30',
  cancelled: 'bg-flare/15 text-flare border-flare/30',
  open: 'bg-flare/15 text-flare border-flare/30',
  resolved: 'bg-lime/15 text-lime border-lime/30',
  new: 'bg-lime/15 text-lime border-lime/30',
  read: 'bg-bone/10 text-bone/70 border-bone/20',
  replied: 'bg-sky/15 text-sky border-sky/30',
}

export function Pill({ status, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${pillMap[status] || 'bg-bone/10 text-bone/70 border-bone/20'} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
      {children || status?.replace('_', ' ')}
    </span>
  )
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-ink-3 text-muted">{icon}</div>
      <p className="font-display text-lg font-bold uppercase tracking-tight">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-muted">{subtitle}</p>}
      {action}
    </div>
  )
}
