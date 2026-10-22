import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { inputClass, Button, Field } from '../components/admin-ui'

export default function AdminLogin() {
  const { user, login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@fitcheck.in')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      push('Welcome back, captain')
      navigate('/admin', { replace: true })
    } catch (err) {
      push(err.message, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="dark-scroll min-h-screen bg-ink text-bone grid place-items-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-lime/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-sky/10 blur-3xl" />

      <div className="animate-scale-in relative w-full max-w-md rounded-3xl border border-line bg-ink-2/90 backdrop-blur p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime text-ink">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="font-display text-xl font-black uppercase tracking-tight">
              Fitcheck<span className="text-lime">.</span> Admin
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Secure control room</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email" required>
            <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Password" required>
            <input type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
          </Field>
          <Button type="submit" loading={loading} className="w-full py-4">
            {loading ? 'Verifying…' : <><Lock size={14} /> Sign in</>}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-line bg-ink px-4 py-3 text-xs text-muted">
          <p className="font-bold uppercase tracking-wider text-bone/70">Demo credentials</p>
          <p className="mt-1">admin@fitcheck.in · admin123</p>
          <p className="mt-1 text-[11px]">Sessions expire after 8 hours · login rate-limited</p>
        </div>

        <a href="/" className="mt-6 block text-center text-xs font-semibold uppercase tracking-wider text-muted hover:text-bone transition-colors">
          ← Back to storefront
        </a>
      </div>
    </div>
  )
}
