import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'fc_cart_v1'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product, size, qty = 1) => {
    setItems((prev) => {
      const key = `${product.id}-${size || 'OS'}`
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(20, i.qty + qty) } : i))
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
          size: size || null,
          qty,
        },
      ]
    })
    setDrawerOpen(true)
  }, [])

  const updateQty = useCallback((key, qty) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty: Math.min(20, qty) } : i))
    )
  }, [])

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0)
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    return { items, count, subtotal, add, updateQty, remove, clear, drawerOpen, setDrawerOpen }
  }, [items, add, updateQty, remove, clear, drawerOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
