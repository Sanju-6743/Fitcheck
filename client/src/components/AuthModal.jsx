import { useState } from 'react'
import { User, Lock, Mail, Phone, ArrowRight, Sparkles } from 'lucide-react'
import Modal from './Modal'
import { inputClass, Field, Button } from './admin-ui'
import { useToast } from '../lib/toast'

const GoogleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
)

export default function AuthModal({ open, onClose }) {
  const [tab, setTab] = useState('login')
  const { push } = useToast()
  const disabled = true

  const blocked = (provider) =>
    push(`Customer ${provider} is coming soon — you can keep shopping as a guest for now.`, 'info', 4200)

  return (
    <Modal open={open} onClose={onClose} title={tab === 'login' ? 'Login' : 'Create account'}>
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-sky/30 bg-sky/10 px-4 py-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-sky" />
          <p className="text-xs leading-relaxed text-bone/75">
            <strong className="text-bone">Accounts are launching soon.</strong> The full login & signup flow is ready below
            but disabled for now — checkout works perfectly as a guest.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-ink p-1">
          {['login', 'signup'].map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`btn-press rounded-full py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                tab === key ? 'bg-lime text-ink' : 'text-muted hover:text-bone'
              }`}
            >
              {key === 'login' ? 'Login' : 'Sign up'}
            </button>
          ))}
        </div>

        <button
          onClick={() => blocked('Google login')}
          disabled={disabled}
          className="btn-press flex w-full items-center justify-center gap-3 rounded-full border border-line bg-ink px-6 py-3.5 text-sm font-bold text-bone opacity-70 cursor-not-allowed hover:opacity-90"
        >
          <GoogleIcon /> Continue with Google
          <span className="rounded-full bg-line px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Soon</span>
        </button>

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted">
          <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            blocked(tab === 'login' ? 'email login' : 'account creation')
          }}
          className="space-y-4"
        >
          {tab === 'signup' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input disabled className={`${inputClass} pl-10 opacity-60 cursor-not-allowed`} placeholder="Your name" />
                </div>
              </Field>
              <Field label="Phone" required>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input disabled className={`${inputClass} pl-10 opacity-60 cursor-not-allowed`} placeholder="98765 43210" />
                </div>
              </Field>
            </div>
          )}
          <Field label="Email" required>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input disabled type="email" className={`${inputClass} pl-10 opacity-60 cursor-not-allowed`} placeholder="you@email.com" />
            </div>
          </Field>
          <Field label="Password" required>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input disabled type="password" className={`${inputClass} pl-10 opacity-60 cursor-not-allowed`} placeholder="••••••••" />
            </div>
          </Field>

          <Button
            type="button"
            loading={false}
            onClick={() => blocked(tab === 'login' ? 'email login' : 'account creation')}
            className="w-full py-4 opacity-80"
            variant="ghost"
          >
            {tab === 'login' ? 'Login' : 'Create account'} <ArrowRight size={14} />
          </Button>
        </form>

        <p className="text-center text-[11px] leading-relaxed text-muted">
          Guest checkout, order tracking and support all work without an account.
        </p>
      </div>
    </Modal>
  )
}
