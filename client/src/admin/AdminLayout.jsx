import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Boxes, Ticket, Receipt, Wallet, MessagesSquare, Inbox, LogOut, Store, Menu, X, KeyRound,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { PageLoader, Spinner } from '../components/Loader'
import Modal from '../components/Modal'
import { Field, inputClass, Button } from '../components/admin-ui'
import { api } from '../lib/api'
import { useToast } from '../lib/toast'

const nav = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/discounts', label: 'Discounts', icon: Ticket },
  { to: '/admin/cashflow', label: 'Cash flow', icon: Wallet },
  { to: '/admin/tickets', label: 'Support tickets', icon: MessagesSquare },
  { to: '/admin/messages', label: 'Inbox', icon: Inbox },
]

export default function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="dark-scroll min-h-screen bg-ink text-bone"><PageLoader label="Checking session" /></div>
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  const changePassword = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/auth/password', { method: 'POST', body: pw })
      push('Password updated')
      setPwOpen(false)
      setPw({ currentPassword: '', newPassword: '' })
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dark-scroll min-h-screen bg-ink text-bone">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-ink-2/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 lg:static lg:z-auto ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between px-5 border-b border-line">
            <NavLink to="/admin" className="font-display text-lg font-black uppercase tracking-tight">
              Fitcheck<span className="text-lime">.</span> <span className="text-[10px] tracking-[0.25em] text-muted">ADMIN</span>
            </NavLink>
            <button className="lg:hidden p-2" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
          </div>

          <nav className="p-3 space-y-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    isActive ? 'bg-lime text-ink shadow-lg shadow-lime/10' : 'text-bone/65 hover:bg-line/40 hover:text-bone'
                  }`
                }
              >
                <item.icon size={17} className="transition-transform duration-300 group-hover:scale-110" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="absolute bottom-0 inset-x-0 border-t border-line p-3 space-y-1">
            <button onClick={() => setPwOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-bone/60 hover:bg-line/40 hover:text-bone transition-colors">
              <KeyRound size={16} /> Change password
            </button>
            <NavLink to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-bone/60 hover:bg-line/40 hover:text-bone transition-colors">
              <Store size={16} /> View storefront
            </NavLink>
            <button
              onClick={async () => { await logout(); push('Signed out'); navigate('/admin/login') }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-flare/80 hover:bg-flare/10 transition-colors"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-ink/90 backdrop-blur-xl px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 -ml-2" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
              <div>
                <p className="font-display text-sm font-black uppercase tracking-tight">Control room</p>
                <p className="text-[11px] text-muted">Manage store, payments & inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-[11px] text-muted">{user.email}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-lime font-display text-sm font-black text-ink">
                {user.name?.[0] || 'A'}
              </span>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8" key={location.pathname}>
            <div className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Change password">
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Current password" required>
            <input type="password" required className={inputClass} value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
          </Field>
          <Field label="New password" required hint="Minimum 8 characters">
            <input type="password" required minLength={8} className={inputClass} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          </Field>
          <Button type="submit" loading={saving} className="w-full">Update password</Button>
        </form>
      </Modal>
    </div>
  )
}
