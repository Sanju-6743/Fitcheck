export function Spinner({ size = 22, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin-slow rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full border-2 border-ink/15" />
        <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-ink" />
        <span className="absolute inset-3 rounded-full bg-lime animate-pulse-dot" />
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{label}…</p>
    </div>
  )
}

export function Skeleton({ className = '', dark = false }) {
  return <div className={`${dark ? 'skeleton-dark' : 'skeleton'} rounded-lg ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function ProgressBar() {
  return (
    <div className="fixed top-0 inset-x-0 z-[90] h-0.5 progress-bar" />
  )
}
