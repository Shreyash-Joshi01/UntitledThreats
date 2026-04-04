# GigShield — Frontend & Backend Dev Guide

> Your scope: `client/` (React) + `server/` (Express.js)
> Teammate scope: `ml-service/` (Flask) — do not touch

---

## 1. Local Dev Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase CLI (`npm install -g supabase`)

### First-time setup

```bash
# Clone repo
git clone https://github.com/your-org/gigshield.git
cd gigshield

# Install all workspaces
npm install

# Set up env files
cp client/.env.example client/.env.local
cp server/.env.example server/.env

# Fill in values (see SUPABASE_SETUP.md for keys)
# Run Supabase migrations
supabase db push

# Start both services together
npm run dev
```

Client runs on `http://localhost:5173`
Server runs on `http://localhost:4000`

---

## 2. Server — Express.js

### Entry Point

```js
// server/src/index.js
import express from 'express'
import cors from 'cors'
import { corsMiddleware } from './middleware/cors.middleware.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import workerRoutes from './routes/worker.routes.js'
import policyRoutes from './routes/policy.routes.js'
import premiumRoutes from './routes/premium.routes.js'
import claimsRoutes from './routes/claims.routes.js'
import triggersRoutes from './routes/triggers.routes.js'

const app = express()

app.use(corsMiddleware)
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/worker', workerRoutes)
app.use('/api/policy', policyRoutes)
app.use('/api/premium', premiumRoutes)
app.use('/api/claims', claimsRoutes)
app.use('/api/triggers', triggersRoutes)

app.use(errorMiddleware)

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`)
})
```

### CORS Config

```js
// server/src/middleware/cors.middleware.js
import cors from 'cors'

export const corsMiddleware = cors({
  origin: process.env.CLIENT_ORIGIN,   // https://gigshield.vercel.app
  methods: ['GET', 'POST', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

### Standardised Response

```js
// server/src/utils/response.js
export const ok = (res, data) => res.json({ success: true, data })
export const fail = (res, status, error) => res.status(status).json({ success: false, error })
```

### Auth Controller (Phone OTP)

```js
// server/src/controllers/auth.controller.js
import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'

export async function sendOTP(req, res) {
  const { phone } = req.body
  if (!phone) return fail(res, 400, 'Phone is required')

  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) return fail(res, 400, error.message)

  ok(res, { message: 'OTP sent' })
}

export async function verifyOTP(req, res) {
  const { phone, token } = req.body
  if (!phone || !token) return fail(res, 400, 'Phone and token required')

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })
  if (error) return fail(res, 401, error.message)

  ok(res, {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: data.user
  })
}
```

### Premium Controller (proxies to Flask ML)

```js
// server/src/controllers/premium.controller.js
import { ok, fail } from '../utils/response.js'

const ML_URL = process.env.ML_SERVICE_URL

export async function calculatePremium(req, res) {
  const { zone_code, weekly_hours, season } = req.query
  const worker = req.worker   // set by auth middleware after DB lookup

  try {
    const mlRes = await fetch(`${ML_URL}/ml/premium/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone_code,
        weekly_hours: parseFloat(weekly_hours),
        season,
        claim_history_count: worker.claim_count ?? 0
      })
    })

    if (!mlRes.ok) {
      // Fallback to rule-based if ML service is down
      return ok(res, getRuleBasedPremium(zone_code, weekly_hours))
    }

    const mlData = await mlRes.json()
    ok(res, mlData)
  } catch (err) {
    // ML service unavailable — use rule-based fallback
    ok(res, getRuleBasedPremium(zone_code, weekly_hours))
  }
}

function getRuleBasedPremium(zone_code, weekly_hours) {
  // Simple fallback without ML — uses base bands from README
  const hrs = parseFloat(weekly_hours)
  let base = 59
  if (hrs > 55) base = 99
  else if (hrs > 40) base = 79
  else if (hrs < 30) base = 39
  return {
    base_premium: base,
    final_premium: base,
    ml_multiplier: 1.0,
    adjustment_factors: { note: 'ML service unavailable — using base band' },
    max_weekly_payout: base === 39 ? 1200 : base === 59 ? 1800 : base === 79 ? 2500 : 3000
  }
}
```

### Triggers Controller (Parametric Event Monitoring)

```js
// server/src/controllers/triggers.controller.js
import { ok, fail } from '../utils/response.js'
import { pollWeather, pollAQI, pollIMDMock, pollCurfewMock } from '../services/weather.service.js'
import supabase from '../config/supabase.js'
import { PAYOUT_TIERS } from '../utils/constants.js'

export async function getActiveTriggers(req, res) {
  const { zone_code } = req.query
  if (!zone_code) return fail(res, 400, 'zone_code required')

  const [weather, aqi, flood, curfew] = await Promise.allSettled([
    pollWeather(zone_code),
    pollAQI(zone_code),
    pollIMDMock(zone_code),
    pollCurfewMock(zone_code)
  ])

  const events = [weather, aqi, flood, curfew]
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)

  // Persist new events to DB (upsert on event_type + zone_code + triggered_at date)
  for (const event of events) {
    await supabase.from('parametric_events').upsert(event, {
      onConflict: 'event_type,zone_code,triggered_at::date'
    })
  }

  ok(res, events)
}
```

### Weather Service (Mock-compatible)

```js
// server/src/services/weather.service.js
const OWM_KEY = process.env.OPENWEATHER_API_KEY
const AQICN_KEY = process.env.AQICN_API_KEY

export async function pollWeather(zone_code) {
  // OpenWeatherMap current weather by zip
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?zip=${zone_code},IN&appid=${OWM_KEY}&units=metric`
  )
  const data = await res.json()
  const rain = data?.rain?.['1h'] ?? 0
  const temp = data?.main?.temp ?? 0

  if (rain > 35) {
    return {
      event_type: 'heavy_rain_90',
      zone_code,
      triggered_at: new Date().toISOString(),
      duration_minutes: 90,
      api_source: 'openweathermap',
      raw_value: rain,
      fixed_payout: 350,
      is_active: true
    }
  }

  if (temp > 42) {
    return {
      event_type: 'extreme_heat',
      zone_code,
      triggered_at: new Date().toISOString(),
      duration_minutes: 120,
      api_source: 'openweathermap',
      raw_value: temp,
      fixed_payout: 200,
      is_active: true
    }
  }

  return null
}

export async function pollAQI(zone_code) {
  const res = await fetch(`https://api.waqi.info/feed/@${zone_code}/?token=${AQICN_KEY}`)
  const data = await res.json()
  const aqi = data?.data?.aqi ?? 0

  if (aqi > 400) {
    return {
      event_type: 'severe_aqi',
      zone_code,
      triggered_at: new Date().toISOString(),
      duration_minutes: 180,
      api_source: 'aqicn',
      raw_value: aqi,
      fixed_payout: 500,
      is_active: true
    }
  }
  return null
}

export async function pollIMDMock(zone_code) {
  // Mock: returns flash flood event for demo zone codes
  const FLOOD_ZONES = ['400001', '500001', '600001']
  if (!FLOOD_ZONES.includes(zone_code)) return null
  // Only return on certain demo conditions (or always for demo)
  return null  // teammate / demo script overrides this
}

export async function pollCurfewMock(zone_code) {
  // Mock curfew alert generator — returns null unless demo mode
  return null
}
```

---

## 3. Frontend — React

### Folder Conventions
- One file per page in `pages/`
- Shared primitives in `components/ui/`
- All API calls through `services/api.js` — never raw fetch in a component
- All formatting in `utils/` — never inline `₹` math in JSX

### Phone OTP Flow

```jsx
// pages/Onboarding/StepPhone.jsx
import { useState } from 'react'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'

export default function StepPhone({ onNext }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSend() {
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/send-otp', { phone: `+91${phone}` })
      onNext({ phone: `+91${phone}` })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="step-phone">
      <h2>Enter your mobile number</h2>
      <div className="phone-input">
        <span>+91</span>
        <input
          type="tel"
          maxLength={10}
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="9876543210"
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button onClick={handleSend} disabled={phone.length !== 10 || loading}>
        {loading ? 'Sending...' : 'Send OTP'}
      </button>
    </div>
  )
}
```

### Premium Calculator Hook

```js
// hooks/usePremium.js
import { useState, useCallback } from 'react'
import { api } from '../services/api'

export function usePremium() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculate = useCallback(async ({ zone_code, weekly_hours }) => {
    setLoading(true)
    setError(null)
    const month = new Date().getMonth()
    const season = (month >= 5 && month <= 8) ? 'monsoon'
      : (month >= 10 || month <= 0) ? 'smog'
      : 'normal'
    try {
      const res = await api.get(
        `/premium/calculate?zone_code=${zone_code}&weekly_hours=${weekly_hours}&season=${season}`
      )
      setData(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, calculate }
}
```

### Currency Formatter

```js
// utils/formatCurrency.js
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
// formatINR(350) → "₹350"
```

---

## 4. Package Dependencies

### client/package.json
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "@supabase/supabase-js": "^2.43.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

> ⚠️ axios is NOT listed. Do not add it.

### server/package.json
```json
{
  "type": "module",
  "dependencies": {
    "express": "^4.19.0",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.43.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

---

## 5. Phase 2 Build Order (Weeks 3–4)

### Week 3
1. Supabase schema + RLS migrations
2. Express server scaffold (auth routes working)
3. React onboarding flow (phone OTP → profile → zone selection)
4. Worker registration API + DB write
5. Policy creation API + active policy fetch
6. Policy page in React

### Week 4
1. Parametric trigger monitoring service (OpenWeatherMap + AQICN)
2. Premium calculator page + ML API proxy route
3. Auto-claim initiation logic (server-side, triggered when event detected + active policy exists)
4. Basic fraud score (rule-based: claim count check)
5. Claims list + status page in React
6. UPI mock payout (Razorpay test mode or hardcoded mock reference)

---

## 6. Demo Script Notes

For the 2-minute demo video, the trigger flow to showcase:
1. Worker is registered with zone `400001` (Mumbai — high risk)
2. Manually POST a mock rain event to `/api/triggers/active` with `zone_code=400001`
3. Server detects threshold crossed → auto-initiates claim → fraud score = 12 (clean) → status = `auto_approved`
4. Dashboard shows payout of ₹350 with "Paid" badge
5. Claims page shows timeline from triggered → approved → paid in under 10 min

Use Supabase Realtime on the `claims` table to push status updates live to the dashboard without polling.

```js
// In useClaims.js — Realtime subscription
supabaseClient
  .channel('claims-live')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'claims',
    filter: `worker_id=eq.${workerId}`
  }, payload => {
    updateClaim(payload.new)
  })
  .subscribe()
```
