import { useState } from 'react'
import { MapPin, Crosshair, ChevronRight, Loader2 } from 'lucide-react'
import { useLocationStore } from '../lib/location'
import { lightInputClass } from './admin-ui'

const fetchPincode = async (value) => {
  const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
  const data = await res.json()
  const office = data?.[0]?.PostOffice?.[0]
  if (!office) return null
  return { city: office.District || office.Name || '', state: office.State || '' }
}

export default function LocationGate() {
  const { resolved, detectByGps, setManual } = useLocationStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [pincode, setPincode] = useState('')
  const [manualError, setManualError] = useState(null)
  const [manualBusy, setManualBusy] = useState(false)

  if (resolved) return null

  const useGps = async () => {
    setBusy(true)
    setError(null)
    try {
      await detectByGps()
    } catch (err) {
      setError(err.message)
      setManualOpen(true)
    } finally {
      setBusy(false)
    }
  }

  const submitManual = async (e) => {
    e.preventDefault()
    setManualBusy(true)
    setManualError(null)
    try {
      if (pincode.length === 6) {
        const place = await fetchPincode(pincode)
        if (!place) {
          setManualError('Could not find that pincode — check the number and try again.')
          return
        }
        setManual({ pincode, city: place.city, state: place.state, label: `${place.city} ${pincode}` })
      } else if (pincode.trim().length >= 3) {
        setManual({ pincode: '', city: pincode.trim(), state: '', label: pincode.trim() })
      } else {
        setManualError('Enter a 6-digit pincode or your city name.')
      }
    } catch {
      setManual({ pincode: '', city: pincode.trim(), state: '', label: pincode.trim() })
    } finally {
      setManualBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink px-4 text-bone">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-lime/15 blur-3xl" />
      <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-sky/10 blur-3xl" />

      <div className="animate-scale-in relative w-full max-w-md rounded-3xl border border-line bg-ink-2/95 p-8 backdrop-blur shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lime text-ink animate-pop">
          <MapPin size={26} />
        </span>
        <p className="mt-6 font-display text-2xl sm:text-3xl font-black uppercase leading-tight tracking-[-0.03em]">
          Set your location
        </p>
        <p className="mt-3 text-sm leading-relaxed text-bone/60">
          We use your location to show delivery estimates, serviceability and faster checkouts — like Flipkart and Swiggy.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-flare/40 bg-flare/10 px-4 py-3 text-xs text-flare">{error}</p>
        )}

        {!manualOpen ? (
          <div className="mt-7 space-y-3">
            <button
              onClick={useGps}
              disabled={busy}
              className="btn-press shine flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-4 text-sm font-black uppercase tracking-[0.15em] text-ink hover:bg-bone disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
              {busy ? 'Detecting…' : 'Use my location'}
            </button>
            <button
              onClick={() => setManualOpen(true)}
              disabled={busy}
              className="btn-press w-full rounded-full border border-line px-6 py-4 text-sm font-black uppercase tracking-[0.15em] hover:bg-line/50"
            >
              Enter location manually
            </button>
            <p className="text-center text-[11px] leading-relaxed text-muted">
              Location stays on your device only. You can change it anytime from the header.
            </p>
          </div>
        ) : (
          <form onSubmit={submitManual} className="mt-7 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                Pincode or city
              </span>
              <input
                autoFocus
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 400050 or Mumbai"
                className={lightInputClass}
              />
              <span className="block text-xs text-muted">6-digit pincode auto-fills your city & state</span>
            </label>
            {manualError && <p className="text-xs text-flare">{manualError}</p>}
            <div className="flex gap-2.5">
              <button
                type="submit"
                disabled={manualBusy}
                className="btn-press shine flex flex-1 items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-black uppercase tracking-[0.15em] text-ink hover:bg-bone disabled:opacity-60"
              >
                {manualBusy ? <Loader2 size={15} className="animate-spin" /> : <>Continue <ChevronRight size={15} /></>}
              </button>
              <button
                type="button"
                onClick={() => { setManualOpen(false); setError(null) }}
                className="btn-press rounded-full border border-line px-5 text-xs font-bold uppercase tracking-wider hover:bg-line/50"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
