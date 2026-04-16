import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'
import { pollWeather, pollAQI, getCurrentEnvironment } from '../services/weather.service.js'
import { PAYOUT_TIERS, WEEKLY_PREMIUM_BANDS } from '../utils/constants.js'
import { getWorkerNotifications } from '../services/notifications.service.js'

// ─── Helper: Predict next-week claims per zone ───────────────────────────────
function predictNextWeekClaims(zoneHistory) {
  const predictions = {}
  for (const [zone, weeklyCounts] of Object.entries(zoneHistory)) {
    if (weeklyCounts.length < 2) {
      predictions[zone] = { expected_claims: 0, risk: 'LOW', trend: '~' }
      continue
    }
    const trend = weeklyCounts[weeklyCounts.length - 1] - weeklyCounts[weeklyCounts.length - 2]
    const nextWeekEstimate = Math.max(0, weeklyCounts[weeklyCounts.length - 1] + trend)
    const risk = nextWeekEstimate > 50 ? 'HIGH' : nextWeekEstimate > 20 ? 'MEDIUM' : 'LOW'
    predictions[zone] = {
      expected_claims: nextWeekEstimate,
      risk,
      trend: trend > 0 ? '+' : trend < 0 ? '-' : '~',
    }
  }
  return predictions
}

// ─── Worker Dashboard ─────────────────────────────────────────────────────────
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

    // 3. Fetch claims history (last 10) with Razorpay payout reference
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

    // 4b. Earnings protected this week (policy × daily wage estimate)
    const earningsProtectedThisWeek = policy
      ? Math.round((policy.max_weekly_payout || 0) * 0.4) // 40% of max as a conservative estimate
      : 0

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
    const [currentEnv, notifications] = await Promise.all([
      getCurrentEnvironment(worker.zone_code),
      getWorkerNotifications(worker.id),
    ])

    ok(res, {
      worker,
      policy: policy || null,
      claims: claims || [],
      notifications,
      earnings: {
        protected_this_week: earningsProtectedThisWeek,
        protected_this_month: totalProtectedThisMonth,
        claims_this_month: totalClaimsThisMonth,
        total_all_time: totalAllTimePayout,
      },
      active_coverage: policy
        ? {
            valid_from: policy.coverage_start,
            valid_to: policy.coverage_end,
            zones_covered: [worker.zone_code],
            weekly_premium_inr: policy.weekly_premium,
            max_weekly_payout_inr: policy.max_weekly_payout,
          }
        : null,
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

// ─── Admin / Insurer Dashboard ────────────────────────────────────────────────
export async function getAdminDashboard(req, res) {
  try {
    // 1. Loss Ratio: Total Claims Paid ÷ Total Premiums Collected (this month)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: monthPremiums } = await supabase
      .from('premium_calculations')
      .select('final_premium')
      .gte('calculated_at', monthStart.toISOString())

    const { data: monthPayouts } = await supabase
      .from('claims')
      .select('payout_amount, status')
      .gte('initiated_at', monthStart.toISOString())

    const totalPremiums = (monthPremiums || []).reduce((s, p) => s + (p.final_premium || 0), 0)
    const totalClaimsPaid = (monthPayouts || [])
      .filter(c => c.status === 'auto_approved')
      .reduce((s, c) => s + (c.payout_amount || 0), 0)

    const lossRatio = totalPremiums > 0 ? Math.round((totalClaimsPaid / totalPremiums) * 1000) / 1000 : 0

    // 2. Active policy count
    const { count: activePolicies } = await supabase
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // 3. Fraud flags this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: fraudFlags } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'flagged')
      .gte('initiated_at', weekAgo)

    // 4. Zone claim counts (last 4 weeks, by zone, weekly buckets)
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
    const { data: zoneClaims } = await supabase
      .from('claims')
      .select('initiated_at, parametric_events(zone_code)')
      .gte('initiated_at', fourWeeksAgo)

    // Group by zone and week number
    const zoneWeekly = {}
    for (const claim of zoneClaims || []) {
      const zone = claim.parametric_events?.zone_code || 'unknown'
      const weekNum = Math.floor(
        (new Date(claim.initiated_at) - new Date(fourWeeksAgo)) / (7 * 24 * 60 * 60 * 1000)
      )
      if (!zoneWeekly[zone]) zoneWeekly[zone] = [0, 0, 0, 0]
      if (weekNum >= 0 && weekNum < 4) zoneWeekly[zone][weekNum]++
    }

    const zonePredictions = predictNextWeekClaims(zoneWeekly)
    const highRiskZones = Object.entries(zonePredictions)
      .filter(([, v]) => v.risk === 'HIGH')
      .map(([zone]) => zone)

    // 5. Recent rejections
    const { data: recentRejections } = await supabase
      .from('claims')
      .select('id, fraud_score, fraud_flags, initiated_at, parametric_events(zone_code, event_type)')
      .eq('status', 'rejected')
      .gte('initiated_at', weekAgo)
      .order('initiated_at', { ascending: false })
      .limit(5)

    ok(res, {
      loss_ratio: lossRatio,
      loss_ratio_pct: `${(lossRatio * 100).toFixed(1)}%`,
      total_premiums_inr: totalPremiums,
      total_claims_inr: totalClaimsPaid,
      active_policies_count: activePolicies || 0,
      fraud_flags_this_week: fraudFlags || 0,
      zone_predictions: zonePredictions,
      high_risk_zones: highRiskZones,
      recent_rejections: recentRejections || [],
    })
  } catch (err) {
    return fail(res, 500, 'Admin dashboard load failed: ' + err.message)
  }
}
