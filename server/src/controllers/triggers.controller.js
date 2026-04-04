import { ok, fail } from '../utils/response.js'
import { pollWeather, pollAQI, pollIMDMock, pollCurfewMock } from '../services/weather.service.js'
import supabase from '../config/supabase.js'
import { initiateClaims } from './claims.controller.js'

export async function getActiveTriggers(req, res) {
  const { zone_code } = req.query
  if (!zone_code) return fail(res, 400, 'zone_code is required')

  const [weatherResult, aqiResult, floodResult, curfewResult] = await Promise.allSettled([
    pollWeather(zone_code),
    pollAQI(zone_code),
    pollIMDMock(zone_code),
    pollCurfewMock(zone_code)
  ])

  const events = [weatherResult, aqiResult, floodResult, curfewResult]
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)

  // Persist new events and auto-initiate claims
  for (const event of events) {
    const { data: saved, error } = await supabase
      .from('parametric_events')
      .upsert(event, { onConflict: 'event_type,zone_code' })
      .select()
      .single()

    if (!error && saved) {
      // Trigger auto-claim initiation in background
      initiateClaims(saved).catch(console.error)
    }
  }

  ok(res, events)
}
