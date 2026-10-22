import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="overlay-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`pop-in relative w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto dark-scroll rounded-t-2xl sm:rounded-2xl bg-ink-2 text-bone border border-line shadow-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink-2/95 backdrop-blur px-5 py-4">
          <h3 className="font-display text-lg font-black uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full btn-press hover:bg-line/60" aria-label="Close">
            <X size={17} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
