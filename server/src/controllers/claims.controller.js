import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'
import { FRAUD_THRESHOLDS, CLAIM_RULES } from '../utils/constants.js'
import { createNotification } from '../services/notifications.service.js'

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

    // Fraud score from ML Service
    let fraud_score = count >= 1 ? 35 : 12
    let status = fraud_score >= FRAUD_THRESHOLDS.auto_reject ? 'rejected' : fraud_score >= FRAUD_THRESHOLDS.soft_hold ? 'flagged' : 'auto_approved'
    let fraud_reason = 'Profile looks typical'
    let fraud_flags = fraud_score > 30 ? ['claim_frequency'] : []

    try {
      // Fetch last 20 claims for behavioral risk analysis
      const { data: claimsHistory } = await supabase
        .from('claims')
        .select('initiated_at, payout_amount, status, policies(workers(zone_code))')
        .eq('worker_id', worker.id)
        .order('initiated_at', { ascending: false })
        .limit(20)

      const behavioralHistory = (claimsHistory || []).map(c => ({
        date: c.initiated_at,
        amount: c.payout_amount,
        status: c.status,
        zone: c.policies?.workers?.zone_code || worker.zone_code,
      }))

      const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/ml/fraud/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: worker.id,
          event_id: event.id,
          motion_data: {
            variance: 5.0,
            is_stationary: 0,
            network_transitions: 0,
            claim_freq_30d: count
          },
          // GPS data (worker zone centroid as proxy — real GPS from mobile SDK)
          lat: null,
          lon: null,
          claim_location: null,
          last_known_location: null,
          minutes_since_last_ping: 60,
          // Weather context
          event_datetime: event.triggered_at,
          event_type: event.event_type,
          // Behavioral history
          claims_history: behavioralHistory,
        }),
        signal: AbortSignal.timeout(5000)
      })

      if (mlRes.ok) {
        const mlData = await mlRes.json()
        fraud_score = mlData.fraud_score
        status = mlData.decision === 'approved' ? 'auto_approved' : mlData.decision === 'soft_hold' ? 'flagged' : 'rejected'
        fraud_reason = mlData.reason
        if (fraud_score >= FRAUD_THRESHOLDS.soft_hold) fraud_flags = ['ml_anomaly', fraud_reason]
      }
    } catch (err) {
      console.warn('ML Service unreachable, using rule-based fraud detection.')
    }

    const { data: newClaim } = await supabase.from('claims').insert({
      worker_id: worker.id,
      policy_id: policy.id,
      event_id: event.id,
      status,
      payout_amount: event.fixed_payout,
      fraud_score,
      fraud_flags,
      resolved_at: status === 'auto_approved' ? new Date().toISOString() : null,
      payout_reference: status === 'auto_approved'
        ? `UPI-MOCK-${Date.now()}-${worker.id.slice(0, 8)}`
        : null
    }).select().single()

    // Fire WhatsApp-style notification
    const eventLabel = (event.event_type || 'disruption').replace(/_/g, ' ')
    if (status === 'auto_approved') {
      await createNotification({
        worker_id: worker.id,
        type: 'whatsapp',
        event_type: event.event_type,
        title: `⚡ Payout Approved — ₹${event.fixed_payout}`,
        body: `*GigShield Alert* \n\nYour claim for *${eventLabel}* in zone ${worker.zone_code} has been *auto-approved*. \n\n⚡ ₹${event.fixed_payout} will be credited to your UPI. \n\nNo action needed. Stay safe. 🛡️`,
        amount_inr: event.fixed_payout,
        claim_id: newClaim?.id ?? null,
      })
    } else if (status === 'flagged') {
      await createNotification({
        worker_id: worker.id,
        type: 'whatsapp',
        event_type: event.event_type,
        title: `⚠️ Claim Under Review`,
        body: `*GigShield Alert* \n\nYour claim for *${eventLabel}* is currently under manual review. \n\nReason: ${fraud_reason}. \n\nWe'll update you within 24 hours.`,
        amount_inr: null,
        claim_id: newClaim?.id ?? null,
      })
    }
  }
}
