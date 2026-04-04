import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'
import { FRAUD_THRESHOLDS, CLAIM_RULES } from '../utils/constants.js'

export async function getClaims(req, res) {
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  if (!worker) return fail(res, 404, 'Worker not found')

  const { data, error } = await supabase
    .from('claims')
    .select('*, parametric_events(*)')
    .eq('worker_id', worker.id)
    .order('initiated_at', { ascending: false })

  if (error) return fail(res, 400, error.message)
  ok(res, data)
}

export async function getClaimById(req, res) {
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  if (!worker) return fail(res, 404, 'Worker not found')

  const { data, error } = await supabase
    .from('claims')
    .select('*, parametric_events(*), policies(*)')
    .eq('id', req.params.id)
    .eq('worker_id', worker.id)
    .single()

  if (error || !data) return fail(res, 404, 'Claim not found')
  ok(res, data)
}

export async function appealClaim(req, res) {
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  if (!worker) return fail(res, 404, 'Worker not found')

  const { data: claim } = await supabase
    .from('claims')
    .select('*')
    .eq('id', req.params.id)
    .eq('worker_id', worker.id)
    .single()

  if (!claim) return fail(res, 404, 'Claim not found')
  if (claim.appeal_requested) return fail(res, 409, 'Appeal already submitted')

  const { data, error } = await supabase
    .from('claims')
    .update({ appeal_requested: true })
    .eq('id', claim.id)
    .select()
    .single()

  if (error) return fail(res, 400, error.message)
  ok(res, data)
}

// Internal: auto-initiate claims when a parametric event is detected
export async function initiateClaims(event) {
  // Find all workers in this zone with active, eligible policies
  const { data: policies } = await supabase
    .from('policies')
    .select('*, workers!inner(id, user_id, zone_code, upi_id)')
    .eq('workers.zone_code', event.zone_code)
    .eq('status', 'active')
    .eq('is_claim_eligible', true)

  if (!policies || policies.length === 0) return

  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  for (const policy of policies) {
    const worker = policy.workers

    // Check claim frequency cap (max 2 per 4 weeks)
    const { count } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', worker.id)
      .gte('initiated_at', fourWeeksAgo.toISOString())

    if (count >= CLAIM_RULES.max_claims_per_4_weeks) continue

    // Rule-based fraud score (Phase 1)
    const fraud_score = count >= 1 ? 35 : 12
    const status = fraud_score >= FRAUD_THRESHOLDS.auto_reject
      ? 'rejected'
      : fraud_score >= FRAUD_THRESHOLDS.soft_hold
        ? 'flagged'
        : 'auto_approved'

    await supabase.from('claims').insert({
      worker_id: worker.id,
      policy_id: policy.id,
      event_id: event.id,
      status,
      payout_amount: event.fixed_payout,
      fraud_score,
      fraud_flags: fraud_score > 30 ? ['claim_frequency'] : [],
      resolved_at: status === 'auto_approved' ? new Date().toISOString() : null,
      payout_reference: status === 'auto_approved'
        ? `UPI-MOCK-${Date.now()}-${worker.id.slice(0, 8)}`
        : null
    })
  }
}
