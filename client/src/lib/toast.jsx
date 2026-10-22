import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const icons = {
  success: <CheckCircle2 size={18} className="text-lime" />,
  error: <AlertTriangle size={18} className="text-flare" />,
  info: <Info size={18} className="text-sky" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'success', ttl = 3200) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ttl)
  }, [])

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2.5rem))]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pop-in flex items-start gap-3 rounded-xl border border-line bg-ink text-bone px-4 py-3 shadow-2xl shadow-ink/20"
            role="status"
          >
            <span className="mt-0.5">{icons[toast.type] || icons.info}</span>
            <p className="text-sm leading-snug flex-1">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} className="text-muted hover:text-bone transition-colors" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
