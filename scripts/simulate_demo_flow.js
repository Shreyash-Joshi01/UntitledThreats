#!/usr/bin/env node
/**
 * simulate_demo_flow.js
 * ─────────────────────────────────────────────────────────────────────
 * Triggers a full claim-to-payout demo flow:
 *   1. Creates a parametric event (heavy rain) in the worker's zone
 *   2. Creates an auto_approved claim linked to the event
 *   3. Creates a WhatsApp notification for the worker
 *
 * Usage:
 *   node scripts/simulate_demo_flow.js
 *   node scripts/simulate_demo_flow.js --zone 400001
 *   node scripts/simulate_demo_flow.js --scenario fraud   (creates a rejected claim)
 *   node scripts/simulate_demo_flow.js --scenario heat    (extreme heat event)
 *
 * IMPORTANT: Run from the project root (c:\Untitled Threats\)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const zoneArg  = args.includes('--zone') ? args[args.indexOf('--zone') + 1] : null
const scenario = args.includes('--scenario') ? args[args.indexOf('--scenario') + 1] : 'rain'
const workerIdArg = args.includes('--worker') ? args[args.indexOf('--worker') + 1] : null

// ── Scenario config ───────────────────────────────────────────────────────────
const SCENARIOS = {
  rain: {
    event_type: 'heavy_rain_60',
    raw_value: 62.5,
    fixed_payout: 200,
    duration_minutes: 60,
    label: '🌧️  Heavy Rain (60 min)',
    claim_status: 'auto_approved',
    fraud_score: 12,
  },
  heavy: {
    event_type: 'heavy_rain_90',
    raw_value: 92.1,
    fixed_payout: 350,
    duration_minutes: 90,
    label: '⛈️  Heavy Rain (90 min) — Max Payout',
    claim_status: 'auto_approved',
    fraud_score: 8,
  },
  heat: {
    event_type: 'extreme_heat',
    raw_value: 43.2,
    fixed_payout: 200,
    duration_minutes: 120,
    label: '🌡️  Extreme Heat',
    claim_status: 'auto_approved',
    fraud_score: 15,
  },
  fraud: {
    event_type: 'heavy_rain_60',
    raw_value: 55.0,
    fixed_payout: 200,
    duration_minutes: 60,
    label: '🚨 GPS Fraud Simulation',
    claim_status: 'rejected',
    fraud_score: 93,
    fraud_flags: ['gps_spoof', 'impossible_travel', 'ml_anomaly'],
  },
  aqi: {
    event_type: 'severe_aqi',
    raw_value: 450,
    fixed_payout: 500,
    duration_minutes: 180,
    label: '💨 Severe AQI Alert',
    claim_status: 'auto_approved',
    fraud_score: 10,
  },
}

const cfg = SCENARIOS[scenario] || SCENARIOS.rain

async function run() {
  console.log(`\n🚀 GigShield Demo Simulator`)
  console.log(`   Scenario: ${cfg.label}`)
  console.log(`   Workspace: ${SUPABASE_URL}\n`)

  // 1. Find a worker
  let workerQuery = supabase.from('workers').select('id, zone_code, full_name, user_id').order('updated_at', { ascending: false }).limit(5)
  if (workerIdArg) workerQuery = workerQuery.eq('id', workerIdArg)
  if (zoneArg)     workerQuery = workerQuery.eq('zone_code', zoneArg)

  const { data: workers, error: wErr } = await workerQuery
  if (wErr) {
    console.error('❌  Query error:', wErr.message)
    process.exit(1)
  }
  if (!workers?.length) {
    console.error('❌  No workers found. Register a worker profile first in the app.')
    process.exit(1)
  }
  const worker = workers[0]
  console.log(`✅  Worker: ${worker.full_name || worker.id} (zone: ${worker.zone_code})`)

  // 2. Find or create an active policy
  let { data: policy } = await supabase
    .from('policies')
    .select('id')
    .eq('worker_id', worker.id)
    .eq('status', 'active')
    .single()

  if (!policy) {
    console.log('⚠️  No active policy found. Creating a mock policy...')
    const { data: newPolicy, error: pErr } = await supabase
      .from('policies')
      .insert({
        worker_id: worker.id,
        status: 'active',
        weekly_premium: 35,
        max_weekly_payout: 1500,
        coverage_start: new Date().toISOString(),
        coverage_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        consecutive_weeks: 3,
      })
      .select('id')
      .single()
      
    if (pErr) {
       console.error('❌  Failed to create mock policy:', pErr.message)
       process.exit(1)
    }
    policy = newPolicy
  }
  console.log(`✅  Active Policy: ${policy.id}`)

  // 3. Create parametric event
  const triggeredAt = new Date(Date.now() - 75 * 60 * 1000).toISOString() // 75 mins ago
  const { data: event, error: evErr } = await supabase
    .from('parametric_events')
    .insert({
      event_type: cfg.event_type,
      zone_code: worker.zone_code,
      triggered_at: triggeredAt,
      duration_minutes: cfg.duration_minutes,
      api_source: 'simulate_demo_flow',
      raw_value: cfg.raw_value,
      fixed_payout: cfg.fixed_payout,
      is_active: true,
    })
    .select()
    .single()

  if (evErr) { console.error('❌  Event upsert failed:', evErr.message); process.exit(1) }
  console.log(`✅  Parametric Event: ${event.event_type} @ zone ${event.zone_code} (ID: ${event.id})`)

  // 4. Create claim
  const payoutRef = cfg.claim_status === 'auto_approved'
    ? `UPI-DEMO-${Date.now()}-${worker.id.slice(0, 8)}`
    : null

  const { data: claim, error: cErr } = await supabase
    .from('claims')
    .insert({
      worker_id: worker.id,
      policy_id: policy.id,
      event_id: event.id,
      status: cfg.claim_status,
      payout_amount: cfg.fixed_payout,
      fraud_score: cfg.fraud_score,
      fraud_flags: cfg.fraud_flags || [],
      resolved_at: cfg.claim_status === 'auto_approved' ? new Date().toISOString() : null,
      payout_reference: payoutRef,
    })
    .select()
    .single()

  if (cErr) { console.error('❌  Claim insert failed:', cErr.message); process.exit(1) }
  console.log(`✅  Claim Created: ${claim.id}`)
  console.log(`   Status: ${claim.status.toUpperCase()} | Fraud Score: ${claim.fraud_score} | Payout: ₹${claim.payout_amount}`)

  // 5. Create WhatsApp-style notification
  const eventLabel = cfg.event_type.replace(/_/g, ' ')
  let notifBody = ''

  if (cfg.claim_status === 'auto_approved') {
    notifBody = `*GigShield Alert* \n\nYour claim for *${eventLabel}* in zone ${worker.zone_code} has been *auto-approved*. \n\n⚡ ₹${cfg.fixed_payout} will be credited to your UPI. \n\nNo action needed. Stay safe. 🛡️`
  } else {
    notifBody = `*GigShield Alert* \n\nYour claim for *${eventLabel}* was *rejected* due to a fraud signal (score: ${cfg.fraud_score}/100). \n\nReason: GPS anomaly detected. If you believe this is wrong, tap Appeal in the app.`
  }

  const { error: nErr } = await supabase.from('notifications').insert({
    worker_id: worker.id,
    type: 'whatsapp',
    event_type: cfg.event_type,
    title: cfg.claim_status === 'auto_approved' ? `⚡ Payout Approved — ₹${cfg.fixed_payout}` : `🚨 Claim Rejected`,
    body: notifBody,
    amount_inr: cfg.claim_status === 'auto_approved' ? cfg.fixed_payout : null,
    claim_id: claim.id,
  })

  if (nErr) console.warn('⚠️  Notification insert failed:', nErr.message)
  else console.log(`✅  WhatsApp Notification sent to worker`)

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅  SIMULATION COMPLETE`)
  console.log(`${'─'.repeat(60)}`)
  if (cfg.claim_status === 'auto_approved') {
    console.log(`\n   → Open the app → Activity tab`)
    console.log(`   → You'll see the claim with "Initiate Payout via Razorpay" button`)
    console.log(`   → Use UPI: success@razorpay to simulate a successful payment`)
  } else {
    console.log(`\n   → Open the app → Activity tab`)
    console.log(`   → You'll see the rejected claim with an "Appeal" button`)
    console.log(`   → The WhatsApp panel will show the fraud alert message`)
  }
  console.log(`\n   → The dashboard auto-refreshes every 30 seconds`)
  console.log(`   → Or manually refresh the page to see instant changes\n`)
}

run().catch(err => {
  console.error('❌  Unexpected error:', err.message)
  process.exit(1)
})
