# GigShield — Agent Context Document

> **Purpose:** This document is written for AI coding agents (Claude, Gemini, Copilot, Cursor, etc.).
> Read this before touching any file in this repository. It tells you exactly what exists,
> what is yours to build, what belongs to a teammate, and how all the pieces connect.

---

## Who You Are Helping

A frontend/backend developer responsible for:
- React frontend (client/)
- Express.js middleware (server/)
- Supabase database, auth, and RLS policies (supabase/)

Their teammate owns `ml-service/` (Flask). Do not modify files in `ml-service/`.

---

## What This Product Does

GigShield is a **parametric income protection platform** for Q-Commerce delivery partners
(Zepto, Blinkit) in India. When external disruptions (monsoons, AQI alerts, curfews, floods)
prevent a delivery partner from working, GigShield automatically detects the event via public
APIs and triggers an instant UPI payout — zero manual claim filing required.

**It is NOT a general insurance app. It covers one thing:**
Income lost due to verifiable external disruptions, via fixed predefined payouts.

---

## Parametric Payout Tiers (hardcoded business logic)

These are fixed. They do not change per user. Code them as constants.

```js
// client/src/utils/constants.js  AND  server/src/utils/constants.js
export const PAYOUT_TIERS = {
  heavy_rain_60:  { label: 'Heavy Rain (60 min)',  payout: 200, currency: 'INR' },
  heavy_rain_90:  { label: 'Heavy Rain (90 min)',  payout: 350, currency: 'INR' },
  extreme_heat:   { label: 'Extreme Heat',         payout: 200, currency: 'INR' },
  severe_aqi:     { label: 'Severe AQI',           payout: 500, currency: 'INR' },
  flash_flood:    { label: 'Flash Flood',          payout: 800, currency: 'INR' },
  curfew:         { label: 'Curfew / Section 144', payout: 800, currency: 'INR' },
}

export const WEEKLY_PREMIUM_BANDS = {
  low_standard:   { premium: 39,  maxPayout: 1200 },
  medium_standard:{ premium: 59,  maxPayout: 1800 },
  high_standard:  { premium: 79,  maxPayout: 2500 },
  high_heavy:     { premium: 99,  maxPayout: 3000 },
}

export const FRAUD_THRESHOLDS = {
  soft_hold: 70,
  auto_reject: 90,
}

export const CLAIM_RULES = {
  min_enrollment_weeks: 2,           // Worker must hold policy 2+ weeks before claiming
  max_claims_per_4_weeks: 2,         // Claim frequency cap
  enrollment_freeze_hours: 48,       // Lock new enrollments 48hrs before forecasted event
}
```

---

## API Contract — Express Middleware Routes

All routes are prefixed `/api`. All protected routes require `Authorization: Bearer <supabase_jwt>`.

### Auth Routes (no auth required)
```
POST /api/auth/send-otp
  body: { phone: "+919876543210" }
  response: { success: true, message: "OTP sent" }

POST /api/auth/verify-otp
  body: { phone: "+919876543210", token: "123456" }
  response: { success: true, data: { access_token, refresh_token, user } }
```

### Worker Routes (auth required)
```
GET  /api/worker/me
  response: { success: true, data: Worker }

POST /api/worker/register
  body: { partner_id, upi_id, zone_code, platform, weekly_hours }
  response: { success: true, data: Worker }
```

### Policy Routes (auth required)
```
GET  /api/policy/active
  response: { success: true, data: Policy | null }

POST /api/policy/create
  body: { zone_code } -- premium calculated server-side
  response: { success: true, data: Policy }

POST /api/policy/renew
  body: {}
  response: { success: true, data: Policy }
```

### Premium Routes (auth required)
```
GET  /api/premium/calculate
  query: { zone_code, weekly_hours, season }
  -- Server calls Flask ML: POST /ml/premium/calculate
  response: {
    success: true,
    data: {
      base_premium: 59,
      final_premium: 72,
      ml_multiplier: 1.22,
      adjustment_factors: {
        zone_risk: +15,
        seasonal: +10,
        claim_history: 0,
        loyalty: -8
      },
      max_weekly_payout: 1800
    }
  }
```

### Claims Routes (auth required)
```
GET  /api/claims
  response: { success: true, data: Claim[] }

GET  /api/claims/:id
  response: { success: true, data: Claim }

POST /api/claims/:id/appeal
  response: { success: true, data: Claim }
```

### Triggers Routes (auth required)
```
GET  /api/triggers/active
  query: { zone_code }
  -- Server polls OpenWeatherMap + AQICN + IMD mock
  response: {
    success: true,
    data: ParametricEvent[]
  }
```

---

## API Contract — Flask ML Service (teammate's code)

Your Express server calls these. Do NOT modify the Flask code.
If these routes change, your teammate updates this section.

```
POST /ml/premium/calculate
  body: { zone_code, weekly_hours, season, claim_history_count }
  response: { base_premium, final_premium, multiplier, factors }

POST /ml/fraud/score
  body: { worker_id, event_id, motion_active, network_type, claim_count_4w }
  response: { fraud_score, flags }

POST /ml/risk/profile
  body: { zone_code, worker_id }
  response: { zone_risk_score, worker_risk_score, seasonal_adjustment }
```

---

## Data Models (TypeScript-style for agent reference)

```ts
type Worker = {
  id: string
  user_id: string
  partner_id: string
  phone: string
  upi_id: string
  zone_code: string
  zone_risk: 'low' | 'medium' | 'high'
  zone_risk_score: number        // 1.0–10.0
  weekly_hours: number
  platform: 'zepto' | 'blinkit' | 'both'
  is_active: boolean
  enrolled_at: string
}

type Policy = {
  id: string
  worker_id: string
  status: 'active' | 'inactive' | 'expired'
  weekly_premium: number
  max_weekly_payout: number
  coverage_start: string
  coverage_end: string
  consecutive_weeks: number
  is_claim_eligible: boolean     // computed: consecutive_weeks >= 2
}

type ParametricEvent = {
  id: string
  event_type: 'heavy_rain_60' | 'heavy_rain_90' | 'extreme_heat' | 'severe_aqi' | 'flash_flood' | 'curfew'
  zone_code: string
  triggered_at: string
  duration_minutes: number
  api_source: string
  raw_value: number
  fixed_payout: number
  is_active: boolean
}

type Claim = {
  id: string
  worker_id: string
  policy_id: string
  event_id: string
  status: 'auto_approved' | 'flagged' | 'approved' | 'rejected' | 'pending_review'
  payout_amount: number
  fraud_score: number
  fraud_flags: string[]
  initiated_at: string
  resolved_at: string | null
  payout_reference: string | null
  appeal_requested: boolean
}
```

---

## React — Routing Structure

```
/                     → redirect to /onboarding (if not authed) or /dashboard
/onboarding           → multi-step: phone → OTP → profile → done
/dashboard            → home: active policy banner, live event alerts, last claim
/policy               → current policy details + renewal button
/premium              → premium calculator with ML factor breakdown
/claims               → claims list + status + appeal
/claims/:id           → individual claim detail
```

---

## State Management

Use **Zustand** for global state. Three stores:

```js
// authStore: { user, worker, isLoading, setUser, setWorker, signOut }
// policyStore: { activePolicy, isLoading, fetchPolicy, renewPolicy }
// claimStore: { claims, isLoading, fetchClaims }
```

---

## HTTP Client Rules

- **No axios. Ever.** Use native `fetch()` throughout.
- All API calls go through `client/src/services/api.js` which wraps fetch with:
  - Base URL from `import.meta.env.VITE_API_BASE_URL`
  - Auto-attach `Authorization: Bearer <token>` from Zustand authStore
  - Standardised error handling: throw on non-2xx

```js
// client/src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(path, options = {}) {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
}
```

---

## What NOT To Do

- Do not call Supabase directly from React (except for auth token management via supabase-js)
- Do not install axios
- Do not modify anything in `ml-service/`
- Do not put secrets in `client/` — only `VITE_` prefixed public vars
- Do not write RLS policies that allow client-side inserts on `workers`, `policies`, or `claims`
- Do not hardcode zone codes — always load from `zone_risk_scores` table
- Do not use email OTP — phone OTP only

---

## Hackathon Constraints

- Demo due: April 4, 2026
- Phase 2 deliverables: Registration, Policy Management, Premium Calculator, Claims Management
- All parametric triggers can be mocked for demo (IMD = mock, curfew = mock)
- Razorpay in test/sandbox mode only
- Supabase free tier limits: 500MB DB, 2GB bandwidth — well within demo scope
