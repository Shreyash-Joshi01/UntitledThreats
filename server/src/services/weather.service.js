import 'dotenv/config'

const OWM_KEY  = process.env.OPENWEATHER_API_KEY
const AQICN_KEY = process.env.AQICN_API_KEY

// ── In-memory cache to avoid hammering APIs (TTL: 2 minutes) ──────────────────
const _cache = {}
function fromCache(key) {
  const entry = _cache[key]
  if (entry && Date.now() - entry.ts < 2 * 60 * 1000) return entry.val
  return null
}
function toCache(key, val) { _cache[key] = { val, ts: Date.now() } }

// ── Zone → City mapping for AQICN (AQICN doesn't support ZIP codes reliably) ──
const ZONE_CITIES = {
  '603203': 'chennai',
  '400001': 'mumbai',
  '110001': 'delhi',
  '560001': 'bangalore',
  '500001': 'hyderabad',
  '700001': 'kolkata',
  '380001': 'ahmedabad',
  '411001': 'pune',
  '302001': 'jaipur',
  '226001': 'lucknow',
}

export async function pollWeather(zone_code) {
  if (!OWM_KEY || OWM_KEY === 'your-openweathermap-key') return null

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?zip=${zone_code},IN&appid=${OWM_KEY}&units=metric`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()
    if (data.cod && data.cod !== 200) {
      console.warn('[weather] OWM error:', data.message)
      return null
    }

    const rain = data?.rain?.['1h'] ?? 0
    const temp = data?.main?.temp ?? 0

    if (rain > 35) {
      return {
        event_type: rain > 90 ? 'heavy_rain_90' : 'heavy_rain_60',
        zone_code,
        triggered_at: new Date().toISOString(),
        duration_minutes: rain > 90 ? 90 : 60,
        api_source: 'openweathermap',
        raw_value: rain,
        fixed_payout: rain > 90 ? 350 : 200,
        is_active: true,
      }
    }

    if (temp > 42) {
      return {
        event_type: 'extreme_heat',
        zone_code,
        triggered_at: new Date().toISOString(),
        duration_minutes: 120,
        api_source: 'openweathermap',
        raw_value: temp,
        fixed_payout: 200,
        is_active: true,
      }
    }
  } catch (err) {
    console.warn('[weather] poll failed:', err.message)
  }

  return null
}

export async function pollAQI(zone_code) {
  if (!AQICN_KEY || AQICN_KEY === 'your-aqicn-key') return null

  try {
    const city = ZONE_CITIES[zone_code] || zone_code
    const res = await fetch(
      `https://api.waqi.info/feed/${city}/?token=${AQICN_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()
    if (data.status !== 'ok') return null
    const aqi = data?.data?.aqi ?? 0

    if (aqi > 400) {
      return {
        event_type: 'severe_aqi',
        zone_code,
        triggered_at: new Date().toISOString(),
        duration_minutes: 180,
        api_source: 'aqicn',
        raw_value: aqi,
        fixed_payout: 500,
        is_active: true,
      }
    }
  } catch (err) {
    console.warn('[aqi] poll failed:', err.message)
  }

  return null
}

export async function pollIMDMock(zone_code) {
  // Uncomment for demo mode (flood zones):
  // const FLOOD_DEMO_ZONES = ['400001', '500001']
  // if (FLOOD_DEMO_ZONES.includes(zone_code)) return { ... }
  return null
}

export async function pollCurfewMock(zone_code) {
  return null
}

// ── getCurrentEnvironment: live data for the Home tab cards ──────────────────
export async function getCurrentEnvironment(zone_code) {
  const cacheKey = `env:${zone_code}`
  const cached = fromCache(cacheKey)
  if (cached) return cached

  const defaults = { temp: 30, rain_intensity: 0, aqi: 75, humidity: 60, wind_speed: 10, alerts: [], city: ZONE_CITIES[zone_code] || null }

  try {
    let weatherData = null
    let aqiData = null

    // Parallel fetch with independent error handling
    const [wRes, aRes] = await Promise.allSettled([
      OWM_KEY && OWM_KEY !== 'your-openweathermap-key'
        ? fetch(`https://api.openweathermap.org/data/2.5/weather?zip=${zone_code},IN&appid=${OWM_KEY}&units=metric`, { signal: AbortSignal.timeout(6000) }).then(r => r.json())
        : Promise.resolve(null),

      AQICN_KEY && AQICN_KEY !== 'your-aqicn-key'
        ? fetch(`https://api.waqi.info/feed/${ZONE_CITIES[zone_code] || zone_code}/?token=${AQICN_KEY}`, { signal: AbortSignal.timeout(6000) }).then(r => r.json())
        : Promise.resolve(null),
    ])

    if (wRes.status === 'fulfilled' && wRes.value && wRes.value.cod !== '404') {
      weatherData = wRes.value
    }
    if (aRes.status === 'fulfilled' && aRes.value?.status === 'ok') {
      aqiData = aRes.value
    }

    const result = {
      temp:          weatherData?.main?.temp          ?? defaults.temp,
      rain_intensity: weatherData?.rain?.['1h']       ?? defaults.rain_intensity,
      humidity:      weatherData?.main?.humidity      ?? defaults.humidity,
      wind_speed:    weatherData?.wind?.speed         ?? defaults.wind_speed,
      aqi:           aqiData?.data?.aqi               ?? defaults.aqi,
      weather_desc:  weatherData?.weather?.[0]?.description ?? null,
      city:          weatherData?.name               ?? defaults.city,
      alerts:        weatherData?.alerts              ?? [],
      zone_code,
      fetched_at:    new Date().toISOString(),
    }

    toCache(cacheKey, result)
    return result
  } catch (err) {
    console.warn('[env] getCurrentEnvironment failed:', err.message)
    return defaults
  }
}
