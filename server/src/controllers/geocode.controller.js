import { ok, fail } from '../utils/response.js'

// Maps coordinates to a pin code using OpenStreetMap Nominatim
export async function reverseGeocode(req, res) {
  const { lat, lng } = req.query
  if (!lat || !lng) return fail(res, 400, 'Latitude and longitude are required')

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Untitled Threats/1.0' // Nominatim requires a User-Agent
      }
    })
    
    if (!response.ok) {
      return fail(res, response.status, 'Geocoding failed')
    }

    const data = await response.json()
    const postcode = data.address?.postcode

    if (!postcode) {
      // Fallback if no postcode is directly returned, try to map city to our DB known zones 
      // but assuming Nominatim works in most urban areas.
      const city = data.address?.city || data.address?.town || data.address?.village
      return ok(res, { zone_code: '400001', city, message: 'Fallback to default zone' })
    }

    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county
    
    ok(res, { 
      zone_code: postcode,
      city: city || 'Unknown City'
    })
  } catch (err) {
    return fail(res, 500, 'Failed to reverse geocode: ' + err.message)
  }
}
