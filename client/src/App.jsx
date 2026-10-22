import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { CartProvider } from './lib/cart'
import { ToastProvider } from './lib/toast'
import { AuthProvider, useAuth } from './lib/auth'
import { LocationProvider, useLocationStore } from './lib/location'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import LocationGate from './components/LocationGate'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/Loader'

const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderStatus = lazy(() => import('./pages/OrderStatus'))
const Track = lazy(() => import('./pages/Track'))
const Contact = lazy(() => import('./pages/Contact'))
const Support = lazy(() => import('./pages/Support'))

const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./admin/AdminProducts'))
const AdminInventory = lazy(() => import('./admin/AdminInventory'))
const AdminDiscounts = lazy(() => import('./admin/AdminDiscounts'))
const AdminOrders = lazy(() => import('./admin/AdminOrders'))
const AdminCashflow = lazy(() => import('./admin/AdminCashflow'))
const AdminTickets = lazy(() => import('./admin/AdminTickets'))
const AdminMessages = lazy(() => import('./admin/AdminMessages'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <div className="page-enter mx-auto max-w-3xl px-4 py-28 text-center">
      <p className="font-display text-[7rem] leading-none font-black text-lime-2">404</p>
      <h1 className="font-display text-4xl font-black uppercase tracking-tight">This fit doesn't exist</h1>
      <p className="mt-3 text-muted">The page you're after dropped out of stock.</p>
      <a href="/" className="btn-press shine mt-8 inline-block rounded-full bg-ink px-10 py-4 text-sm font-black uppercase tracking-[0.15em] text-bone hover:bg-lime hover:text-ink">
        Back to home
      </a>
    </div>
  )
}

function StoreLayout({ children }) {
  const { resolved } = useLocationStore()
  return (
    <div className="flex min-h-screen flex-col">
      <LocationGate />
      <div className={`flex min-h-screen flex-1 flex-col transition-all ${resolved ? '' : 'pointer-events-none select-none blur-[3px]'}`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartDrawer />
    </div>
  )
}

function AdminGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="dark-scroll min-h-screen bg-ink text-bone"><PageLoader label="Checking session" /></div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

function AppRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <Suspense fallback={isAdmin ? <div className="dark-scroll min-h-screen bg-ink text-bone"><PageLoader label="Loading" /></div> : <PageLoader label="Loading" />}>
      <Routes location={location}>
        <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
        <Route path="/shop" element={<StoreLayout><Shop /></StoreLayout>} />
        <Route path="/product/:slug" element={<StoreLayout><ProductDetail /></StoreLayout>} />
        <Route path="/cart" element={<StoreLayout><Cart /></StoreLayout>} />
        <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />
        <Route path="/order/:code" element={<StoreLayout><OrderStatus /></StoreLayout>} />
        <Route path="/track" element={<StoreLayout><Track /></StoreLayout>} />
        <Route path="/contact" element={<StoreLayout><Contact /></StoreLayout>} />
        <Route path="/support" element={<StoreLayout><Support /></StoreLayout>} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="discounts" element={<AdminDiscounts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="cashflow" element={<AdminCashflow />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="messages" element={<AdminMessages />} />
        </Route>

        <Route path="*" element={<StoreLayout><NotFound /></StoreLayout>} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <LocationProvider>
              <ScrollToTop />
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </LocationProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
