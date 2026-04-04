import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'
import { WEEKLY_PREMIUM_BANDS } from '../utils/constants.js'

export async function getActivePolicy(req, res) {
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  if (!worker) return fail(res, 404, 'Worker not found')

  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('worker_id', worker.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') return fail(res, 400, error.message)
  ok(res, data || null)
}

export async function createPolicy(req, res) {
  const { zone_code } = req.body

  const { data: worker } = await supabase
    .from('workers')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (!worker) return fail(res, 404, 'Worker not found — register first')

  // Calculate premium based on zone risk and hours
  const hours = worker.weekly_hours || 40
  let band = WEEKLY_PREMIUM_BANDS.medium_standard

  if (worker.zone_risk === 'high' && hours > 55) {
    band = WEEKLY_PREMIUM_BANDS.high_heavy
  } else if (worker.zone_risk === 'high') {
    band = WEEKLY_PREMIUM_BANDS.high_standard
  } else if (worker.zone_risk === 'low' && hours < 40) {
    band = WEEKLY_PREMIUM_BANDS.low_standard
  }

  const coverage_start = new Date()
  const coverage_end = new Date(coverage_start)
  coverage_end.setDate(coverage_end.getDate() + 7)

  // Expire any existing active policies
  await supabase
    .from('policies')
    .update({ status: 'expired' })
    .eq('worker_id', worker.id)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('policies')
    .insert({
      worker_id: worker.id,
      weekly_premium: band.premium,
      max_weekly_payout: band.maxPayout,
      coverage_start: coverage_start.toISOString(),
      coverage_end: coverage_end.toISOString(),
      consecutive_weeks: 1,
      status: 'active'
    })
    .select()
    .single()

  if (error) return fail(res, 400, error.message)
  ok(res, data)
}

export async function renewPolicy(req, res) {
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  if (!worker) return fail(res, 404, 'Worker not found')

  const { data: current } = await supabase
    .from('policies')
    .select('*')
    .eq('worker_id', worker.id)
    .eq('status', 'active')
    .single()

  if (!current) return fail(res, 404, 'No active policy to renew')

  const coverage_start = new Date(current.coverage_end)
  const coverage_end = new Date(coverage_start)
  coverage_end.setDate(coverage_end.getDate() + 7)

  // Expire current
  await supabase.from('policies').update({ status: 'expired' }).eq('id', current.id)

  // Create renewed policy with incremented consecutive_weeks
  const { data, error } = await supabase
    .from('policies')
    .insert({
      worker_id: worker.id,
      weekly_premium: current.weekly_premium,
      max_weekly_payout: current.max_weekly_payout,
      coverage_start: coverage_start.toISOString(),
      coverage_end: coverage_end.toISOString(),
      consecutive_weeks: current.consecutive_weeks + 1,
      status: 'active'
    })
    .select()
    .single()

  if (error) return fail(res, 400, error.message)
  ok(res, data)
}
