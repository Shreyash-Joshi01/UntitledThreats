import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'

export async function getMe(req, res) {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (error || !data) return fail(res, 404, 'Worker profile not found')
  ok(res, data)
}

export async function registerWorker(req, res) {
  const { 
    phone, upi_id, zone_code, platform, weekly_hours
  } = req.body

  if (!phone || !upi_id || !zone_code || !platform) {
    return fail(res, 400, 'phone, upi_id, zone_code, and platform are required')
  }

  const validPlatforms = ['zepto', 'blinkit', 'both']
  if (!validPlatforms.includes(platform)) {
    return fail(res, 400, `platform must be one of: ${validPlatforms.join(', ')}`)
  }

  // Check if worker already exists
  const { data: existing } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  if (existing) return fail(res, 409, 'Worker profile already exists')

  // Fetch zone risk score
  const { data: zoneData } = await supabase
    .from('zone_risk_scores')
    .select('risk_score')
    .eq('zone_code', zone_code)
    .single()

  const zone_risk_score = zoneData?.risk_score || 5.0
  const zone_risk = zone_risk_score >= 7.5 ? 'high' : zone_risk_score >= 5 ? 'medium' : 'low'

  // Auto-generate a unique partner_id
  const partner_id = `GS-${Date.now()}-${req.user.id.slice(0, 6).toUpperCase()}`

  const { data, error } = await supabase
    .from('workers')
    .insert({
      user_id: req.user.id,
      partner_id,
      phone,
      upi_id,
      zone_code,
      zone_risk,
      zone_risk_score,
      platform,
      weekly_hours: weekly_hours || 40,
    })
    .select()
    .single()

  if (error) return fail(res, 400, error.message)
  ok(res, data)
}

export async function updateZone(req, res) {
  const { zone_code } = req.body
  if (!zone_code) return fail(res, 400, 'zone_code is required')

  // Fetch zone risk score
  const { data: zoneData } = await supabase
    .from('zone_risk_scores')
    .select('risk_score')
    .eq('zone_code', zone_code)
    .single()

  const zone_risk_score = zoneData?.risk_score || 5.0
  const zone_risk = zone_risk_score >= 7.5 ? 'high' : zone_risk_score >= 5 ? 'medium' : 'low'

  const { data, error } = await supabase
    .from('workers')
    .update({ zone_code, zone_risk, zone_risk_score })
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return fail(res, 400, error.message)
  ok(res, data)
}

