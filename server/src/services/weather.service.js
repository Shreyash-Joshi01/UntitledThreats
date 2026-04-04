import 'dotenv/config'

const OWM_KEY = process.env.OPENWEATHER_API_KEY
const AQICN_KEY = process.env.AQICN_API_KEY

export async function pollWeather(zone_code) {
  if (!OWM_KEY || OWM_KEY === 'your-openweathermap-key') return null

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?zip=${zone_code},IN&appid=${OWM_KEY}&units=metric`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()

    const rain = data?.rain?.['1h'] ?? 0
    const temp = data?.main?.temp ?? 0

    if (rain > 35) {
      return {
        event_type: rain > 35 ? 'heavy_rain_90' : 'heavy_rain_60',
        zone_code,
        triggered_at: new Date().toISOString(),
        duration_minutes: 90,
        api_source: 'openweathermap',
        raw_value: rain,
        fixed_payout: 350,
        is_active: true
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
        is_active: true
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
    const res = await fetch(
      `https://api.waqi.info/feed/@${zone_code}/?token=${AQICN_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()
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
        is_active: true
      }
    }
  } catch (err) {
    console.warn('[aqi] poll failed:', err.message)
  }

  return null
}

export async function pollIMDMock(zone_code) {
  // Flood demo zones — returns event for demo zone codes
  const FLOOD_DEMO_ZONES = ['400001', '500001', '600001']
  if (!FLOOD_DEMO_ZONES.includes(zone_code)) return null

  // Uncomment for demo mode:
  // return {
  //   event_type: 'flash_flood',
  //   zone_code,
  //   triggered_at: new Date().toISOString(),
  //   duration_minutes: null,
  //   api_source: 'imd_mock',
  //   raw_value: null,
  //   fixed_payout: 800,
  //   is_active: true
  // }

  return null
}

export async function pollCurfewMock(zone_code) {
  return null
}

export async function getCurrentEnvironment(zone_code) {
  try {
    const defaultEnv = { temp: 30, rain: 0, aqi: 50 }; // Fallback
    
    let weatherRes = null;
    let aqiRes = null;

    if (OWM_KEY && OWM_KEY !== 'your-openweathermap-key') {
      const wUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${zone_code},IN&appid=${OWM_KEY}&units=metric`;
       weatherRes = await fetch(wUrl, { signal: AbortSignal.timeout(5000) }).then(r => r.json()).catch(() => null);
    }
    
    if (AQICN_KEY && AQICN_KEY !== 'your-aqicn-key') {
       // Note: AQICN feed uses cities or lat/lng. Sometimes zip codes work with `@zip` if registered, 
       // but typically it's a search. If we can't reliably use zip, we'll try it.
       const aUrl = `https://api.waqi.info/feed/${zone_code}/?token=${AQICN_KEY}`;
       aqiRes = await fetch(aUrl, { signal: AbortSignal.timeout(5000) }).then(r => r.json()).catch(() => null);
    }

    return {
      temp: weatherRes?.main?.temp ?? defaultEnv.temp,
      rain: weatherRes?.rain?.['1h'] ?? defaultEnv.rain,
      aqi: aqiRes?.data?.aqi ?? defaultEnv.aqi,
      alerts: [] // Real implementation could parse weatherRes.alerts if OpenWeather OneCall is used
    };
  } catch (err) {
    return { temp: 30, rain: 0, aqi: 50, alerts: [] };
  }
}
