const nominatimHeaders = { 'User-Agent': 'FitcheckStore/1.0' }

export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export async function lookupPincode(value) {
  const pin = String(value || '').trim()
  if (!/^\d{6}$/.test(pin)) return null
  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
  const data = await res.json()
  const office = data?.[0]?.PostOffice?.[0]
  if (!office) return null
  return {
    city: office.District || office.Name || '',
    state: office.State || '',
    area: office.Name || '',
    division: office.Division || '',
  }
}

let placesPromise = null

function loadGooglePlaces() {
  if (!GOOGLE_MAPS_KEY) return Promise.resolve(null)
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps.places)
  if (placesPromise) return placesPromise
  placesPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=__fcPlacesReady`
    window.__fcPlacesReady = () => resolve(window.google.maps.places)
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
  return placesPromise
}

export async function searchAddresses(query) {
  const q = String(query || '').trim()
  if (q.length < 3) return []

  try {
    const places = await loadGooglePlaces()
    if (places) {
      const service = new places.AutocompleteService()
      const predictions = await new Promise((resolve, reject) => {
        service.getPlacePredictions({ input: q, componentRestrictions: { country: 'in' } }, (preds, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) resolve(preds)
          else resolve([])
        })
      })
      return predictions.map((p) => ({ id: p.place_id, label: p.structured_formatting?.main_text || p.description, description: p.description }))
    }
  } catch {
    /* fall through to OSM */
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
      { headers: nominatimHeaders }
    )
    const data = await res.json()
    return data.map((item) => ({
      id: String(item.place_id),
      label: item.display_name.split(',').slice(0, 2).join(','),
      description: item.display_name,
      lat: item.lat,
      lon: item.lon,
      address: item.address || {},
    }))
  } catch {
    return []
  }
}

export function parseAddressParts(displayName) {
  const parts = String(displayName || '').split(',').map((p) => p.trim()).filter(Boolean)
  const pinMatch = String(displayName).match(/\b\d{6}\b/)
  return {
    pincode: pinMatch ? pinMatch[0] : '',
    state: parts.length > 1 ? parts[parts.length - 1] : '',
    city: parts.length > 2 ? parts[parts.length - 2] : parts[0] || '',
  }
}
