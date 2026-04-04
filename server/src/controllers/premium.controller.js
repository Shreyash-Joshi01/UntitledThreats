import { ok, fail } from '../utils/response.js'
import supabase from '../config/supabase.js'
import { WEEKLY_PREMIUM_BANDS } from '../utils/constants.js'
import 'dotenv/config'

const ML_URL = process.env.ML_SERVICE_URL

export async function calculatePremium(req, res) {
  const { zone_code, weekly_hours } = req.query

  const { data: worker } = await supabase
    .from('workers')
    .select('*, policies(count)')
    .eq('user_id', req.user.id)
    .single()

  const month = new Date().getMonth()
  const season = (month >= 5 && month <= 8) ? 'monsoon'
    : (month >= 10 || month <= 0) ? 'smog'
    : 'normal'

  const claim_history_count = worker?.claim_count ?? 0

  try {
    const mlRes = await fetch(`${ML_URL}/ml/premium/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone_code: zone_code || worker?.zone_code,
        weekly_hours: parseFloat(weekly_hours || worker?.weekly_hours || 40),
        season,
        claim_history_count
      }),
      signal: AbortSignal.timeout(5000)
    })

    if (mlRes.ok) {
      const mlData = await mlRes.json()
      return ok(res, mlData)
    }
  } catch {
    // ML service down — fall through to rule-based
  }

  // Fallback: rule-based premium calculation
  ok(res, getRuleBasedPremium(zone_code || worker?.zone_code, parseFloat(weekly_hours || 40)))
}

function getRuleBasedPremium(zone_code, weekly_hours) {
  const hrs = parseFloat(weekly_hours)
  let band = WEEKLY_PREMIUM_BANDS.medium_standard

  if (hrs > 55) band = WEEKLY_PREMIUM_BANDS.high_heavy
  else if (hrs > 40) band = WEEKLY_PREMIUM_BANDS.high_standard
  else if (hrs < 30) band = WEEKLY_PREMIUM_BANDS.low_standard

  return {
    base_premium: band.premium,
    final_premium: band.premium,
    ml_multiplier: 1.0,
    adjustment_factors: { note: 'ML service unavailable — using base band' },
    max_weekly_payout: band.maxPayout
  }
}
