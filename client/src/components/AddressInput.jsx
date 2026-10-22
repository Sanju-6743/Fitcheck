import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { searchAddresses, parseAddressParts } from '../lib/geo'
import { lightInputClass } from './admin-ui'

export default function AddressInput({ value, onChange, onPlaceSelected, required, placeholder }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const boxRef = useRef(null)
  const timerRef = useRef(null)
  const skipFetch = useRef(false)

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false
      return
    }
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const onClickAway = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  const fetchSuggestions = (text) => {
    clearTimeout(timerRef.current)
    if (text.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      setBusy(false)
      return
    }
    setBusy(true)
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(text)
        setSuggestions(results)
        setOpen(results.length > 0)
        setHighlight(-1)
      } catch {
        setSuggestions([])
        setOpen(false)
      } finally {
        setBusy(false)
      }
    }, 450)
  }

  const pick = (suggestion) => {
    skipFetch.current = true
    setQuery(suggestion.label)
    setOpen(false)
    setSuggestions([])
    onChange?.(suggestion.label)
    if (onPlaceSelected) {
      const parts = parseAddressParts(suggestion.description)
      onPlaceSelected({ ...parts, full: suggestion.description, label: suggestion.label })
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        {busy ? (
          <Loader2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        ) : (
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        )}
        <input
          required={required}
          className={`${lightInputClass} pl-10`}
          value={query}
          placeholder={placeholder || 'Search your address (area, landmark, city)…'}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange?.(e.target.value)
            fetchSuggestions(e.target.value)
          }}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlight((h) => Math.min(h + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlight((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter' && highlight >= 0) {
              e.preventDefault()
              pick(suggestions[highlight])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        <MapPin size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="animate-scale-in absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-ink/15 bg-white shadow-2xl shadow-ink/20">
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(s)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  highlight === i ? 'bg-lime/20' : 'hover:bg-bone-2'
                }`}
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-lime-2" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.label}</span>
                  <span className="block truncate text-xs text-muted">{s.description}</span>
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-ink/10 px-4 py-2 text-[10px] uppercase tracking-wider text-muted">
            {GOOGLE_KEY_PRESENT ? 'Google Maps' : '© OpenStreetMap contributors'}
          </li>
        </ul>
      )}
    </div>
  )
}

const GOOGLE_KEY_PRESENT = !!(typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY)
