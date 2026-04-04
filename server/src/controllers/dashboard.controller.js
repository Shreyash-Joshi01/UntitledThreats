import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'
import { pollWeather, pollAQI, getCurrentEnvironment } from '../services/weather.service.js'
import { PAYOUT_TIERS, WEEKLY_PREMIUM_BANDS } from '../utils/constants.js'

export async function getDashboardSummary(req, res) {
  try {
    // 1. Fetch worker profile
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (workerError || !worker) return fail(res, 404, 'Worker profile not found')

    // 2. Fetch active policy
    const { data: policy } = await supabase
      .from('policies')
      .select('*')
      .eq('worker_id', worker.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 3. Fetch claims history (last 10)
    const { data: claims } = await supabase
      .from('claims')
      .select('*, parametric_events(*)')
      .eq('worker_id', worker.id)
      .order('initiated_at', { ascending: false })
      .limit(10)

    // 4. Compute earnings protected this month
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: monthClaims } = await supabase
      .from('claims')
      .select('payout_amount, status')
      .eq('worker_id', worker.id)
      .gte('initiated_at', monthStart.toISOString())

    const totalProtectedThisMonth = (monthClaims || [])
      .filter(c => c.status === 'auto_approved')
      .reduce((sum, c) => sum + (c.payout_amount || 0), 0)

    const totalClaimsThisMonth = (monthClaims || []).length

    // 5. Fetch active parametric events in worker's zone (live poll)
    const [weatherEvent, aqiEvent] = await Promise.allSettled([
      pollWeather(worker.zone_code),
      pollAQI(worker.zone_code),
    ])

    const liveEvents = [weatherEvent, aqiEvent]
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)

    // 6. Fetch zone risk score
    const { data: zoneData } = await supabase
      .from('zone_risk_scores')
      .select('*')
      .eq('zone_code', worker.zone_code)
      .single()

    // 7. Premium band info
    const hrs = worker.weekly_hours || 40
    let bandKey = 'medium_standard'
    if (worker.zone_risk === 'high' && hrs > 55) bandKey = 'high_heavy'
    else if (worker.zone_risk === 'high') bandKey = 'high_standard'
    else if (worker.zone_risk === 'low' && hrs < 40) bandKey = 'low_standard'

    const premiumBand = WEEKLY_PREMIUM_BANDS[bandKey]

    // 8. All-time totals
    const { data: allClaims } = await supabase
      .from('claims')
      .select('payout_amount, status')
      .eq('worker_id', worker.id)

    const totalAllTimePayout = (allClaims || [])
      .filter(c => c.status === 'auto_approved')
      .reduce((sum, c) => sum + (c.payout_amount || 0), 0)

    // 9. Current Environment Data (live from APIs)
    const currentEnv = await getCurrentEnvironment(worker.zone_code)

    ok(res, {
      worker,
      policy: policy || null,
      claims: claims || [],
      earnings: {
        protected_this_month: totalProtectedThisMonth,
        claims_this_month: totalClaimsThisMonth,
        total_all_time: totalAllTimePayout,
      },
      live_events: liveEvents,
      current_env: currentEnv,
      zone_info: zoneData || null,
      premium: {
        band_key: bandKey,
        weekly_premium: premiumBand.premium,
        max_weekly_payout: premiumBand.maxPayout,
      },
      payout_tiers: PAYOUT_TIERS,
    })
  } catch (err) {
    return fail(res, 500, 'Dashboard load failed: ' + err.message)
  }
}
