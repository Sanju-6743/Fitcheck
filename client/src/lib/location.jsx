import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LocationContext = createContext(null)
const STORAGE_KEY = 'fc_location_v1'

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(readStore)
  const [resolved, setResolved] = useState(!!readStore())

  useEffect(() => {
    if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
    else localStorage.removeItem(STORAGE_KEY)
  }, [location])

  const save = useCallback((next) => {
    setLocation(next)
    setResolved(true)
  }, [])

  const clear = useCallback(() => {
    setLocation(null)
    setResolved(false)
  }, [])

  const detectByGps = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation is not supported by this browser'))
          return
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            let place = { city: '', state: '', label: 'Current location' }
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                { headers: { 'User-Agent': 'FitcheckStore/1.0' } }
              )
              const data = await res.json()
              const addr = data.address || {}
              place = {
                city: addr.city || addr.town || addr.suburb || addr.village || addr.county || '',
                state: addr.state || '',
                label: [addr.suburb || addr.neighbourhood || addr.road, addr.city || addr.town || addr.state]
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ') || 'Current location',
              }
            } catch {
              /* offline — keep coords only */
            }
            const next = {
              mode: 'gps',
              lat: Number(latitude.toFixed(6)),
              lon: Number(longitude.toFixed(6)),
              city: place.city,
              state: place.state,
              pincode: '',
              label: place.label,
              grantedAt: new Date().toISOString(),
            }
            save(next)
            resolve(next)
          },
          (error) => {
            const messages = {
              1: 'Location permission denied. Please allow location access to continue.',
              2: 'Location unavailable — please enter your area manually.',
              3: 'Location request timed out — please enter your area manually.',
            }
            reject(new Error(messages[error.code] || 'Could not detect location'))
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        )
      }),
    [save]
  )

  const setManual = useCallback(
    ({ pincode = '', city = '', state = '', label = '' }) => {
      save({
        mode: 'manual',
        pincode,
        city,
        state,
        lat: null,
        lon: null,
        label: label || [city, pincode].filter(Boolean).join(' ') || 'India',
        grantedAt: new Date().toISOString(),
      })
    },
    [save]
  )

  const value = useMemo(
    () => ({ location, resolved, save, clear, detectByGps, setManual }),
    [location, resolved, save, clear, detectByGps, setManual]
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export const useLocationStore = () => {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationStore must be used within LocationProvider')
  return ctx
}
