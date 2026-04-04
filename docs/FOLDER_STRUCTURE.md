# GigShield — Monorepo Folder Structure

> **Last updated:** Phase 2 (Weeks 3–4)
> **Managed by:** You (client + server) | Teammate (ml-service)
> **Deployment:** Vercel (client) · Render Service 1 (server) · Render Service 2 (ml-service) · Supabase Cloud (db)

---

## Top-Level Layout

```
gigshield/
│
├── client/                   # React PWA — YOUR RESPONSIBILITY
├── server/                   # Express.js Middleware — YOUR RESPONSIBILITY
├── ml-service/               # Flask ML APIs — TEAMMATE'S RESPONSIBILITY
├── supabase/                 # Supabase migrations, seeds, types — YOUR RESPONSIBILITY
├── docs/                     # All .md documentation
│
├── .env.example              # Root env template (never commit real values)
├── .gitignore
├── render.yaml               # Render multi-service deployment config
├── package.json              # Root (workspaces, shared scripts only)
└── README.md
```

---

## `/client` — React Frontend (Vercel)

```
client/
│
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── favicon.ico
│   └── icons/                # PWA icons (192x192, 512x512)
│
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Router root
│   │
│   ├── pages/
│   │   ├── Onboarding/
│   │   │   ├── index.jsx     # Route: /onboarding
│   │   │   ├── StepPhone.jsx
│   │   │   ├── StepOTP.jsx
│   │   │   ├── StepProfile.jsx   # Partner ID, zone, UPI
│   │   │   └── StepDone.jsx
│   │   │
│   │   ├── Dashboard/
│   │   │   └── index.jsx     # Route: /dashboard (home after login)
│   │   │
│   │   ├── Policy/
│   │   │   ├── index.jsx     # Route: /policy
│   │   │   ├── PolicyCard.jsx
│   │   │   └── PolicyRenew.jsx
│   │   │
│   │   ├── Premium/
│   │   │   ├── index.jsx     # Route: /premium
│   │   │   └── PremiumFactors.jsx   # ML breakdown component
│   │   │
│   │   ├── Claims/
│   │   │   ├── index.jsx     # Route: /claims
│   │   │   ├── ClaimCard.jsx
│   │   │   ├── ClaimStatus.jsx
│   │   │   └── ClaimHistory.jsx
│   │   │
│   │   └── NotFound.jsx      # 404
│   │
│   ├── components/
│   │   ├── ui/               # Primitive components (Button, Badge, Card, etc.)
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── OTPInput.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── BottomNav.jsx  # Mobile bottom navigation
│   │   │   └── PageWrapper.jsx
│   │   │
│   │   └── shared/
│   │       ├── EventTriggerBanner.jsx   # Live weather/AQI alert banner
│   │       ├── ZoneRiskBadge.jsx
│   │       └── PayoutTimeline.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js         # Auth state + phone OTP flow
│   │   ├── usePolicy.js       # Policy fetch + renewal
│   │   ├── useClaims.js       # Claims fetch + real-time status
│   │   ├── usePremium.js      # ML premium API call
│   │   └── useTriggers.js     # Live parametric trigger monitoring
│   │
│   ├── services/
│   │   ├── api.js             # Base fetch wrapper (NO axios)
│   │   ├── auth.service.js    # Phone OTP via middleware
│   │   ├── policy.service.js
│   │   ├── claims.service.js
│   │   └── premium.service.js # Calls middleware → Flask ML
│   │
│   ├── store/
│   │   ├── authStore.js       # Zustand auth state
│   │   ├── policyStore.js
│   │   └── claimStore.js
│   │
│   ├── utils/
│   │   ├── formatCurrency.js  # ₹ formatting
│   │   ├── formatDate.js
│   │   └── constants.js       # Event types, payout tiers, zone codes
│   │
│   └── styles/
│       ├── index.css          # Tailwind base + CSS variables
│       └── theme.css          # Design tokens (colors, spacing, typography)
│
├── .env.example
│   # VITE_API_BASE_URL=https://gigshield-server.onrender.com
│
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── package.json
```

---

## `/server` — Express.js Middleware (Render Service 1)

```
server/
│
├── src/
│   ├── index.js               # Entry point — starts Express app
│   │
│   ├── config/
│   │   ├── supabase.js        # Supabase client (service role key)
│   │   └── env.js             # Validated env vars (no process.env scattered)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js  # Validates Supabase JWT on every protected route
│   │   ├── error.middleware.js # Global error handler
│   │   └── cors.middleware.js  # CORS config for Vercel origin
│   │
│   ├── routes/
│   │   ├── auth.routes.js      # POST /auth/send-otp, POST /auth/verify-otp
│   │   ├── policy.routes.js    # GET /policy, POST /policy/create, POST /policy/renew
│   │   ├── claims.routes.js    # GET /claims, GET /claims/:id, POST /claims/initiate
│   │   ├── premium.routes.js   # GET /premium/calculate → proxies to Flask ML
│   │   └── triggers.routes.js  # GET /triggers/active → weather/AQI/IMD polling
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── policy.controller.js
│   │   ├── claims.controller.js
│   │   ├── premium.controller.js
│   │   └── triggers.controller.js
│   │
│   ├── services/
│   │   ├── supabase.service.js  # All DB read/write via supabase-js
│   │   ├── ml.service.js        # fetch() calls to Flask ML service
│   │   ├── weather.service.js   # OpenWeatherMap + AQICN polling
│   │   └── payout.service.js    # Razorpay test mode / UPI mock
│   │
│   └── utils/
│       ├── response.js          # Standardised { success, data, error } wrapper
│       └── logger.js            # Console logger with timestamps
│
├── .env.example
│   # PORT=4000
│   # SUPABASE_URL=
│   # SUPABASE_SERVICE_ROLE_KEY=
│   # ML_SERVICE_URL=https://gigshield-ml.onrender.com
│   # OPENWEATHER_API_KEY=
│   # AQICN_API_KEY=
│   # CLIENT_ORIGIN=https://gigshield.vercel.app
│
├── package.json
└── Dockerfile                  # Optional: for Render Docker deploy
```

---

## `/ml-service` — Flask ML (Render Service 2) — TEAMMATE OWNS

```
ml-service/
│
├── app/
│   ├── __init__.py
│   ├── routes/
│   │   ├── pricing.py         # POST /ml/premium/calculate
│   │   ├── fraud.py           # POST /ml/fraud/score
│   │   └── risk.py            # POST /ml/risk/profile
│   │
│   ├── models/
│   │   ├── pricing_model.pkl  # Trained XGBoost model (teammate pushes)
│   │   ├── fraud_model.pkl    # Isolation Forest
│   │   └── risk_model.pkl
│   │
│   └── utils/
│       └── validators.py
│
├── data/
│   └── zone_scores.csv        # Historical disruption data per pin code
│
├── requirements.txt
├── wsgi.py                    # Gunicorn entry point for Render
└── .env.example
    # SUPABASE_URL=
    # SUPABASE_SERVICE_ROLE_KEY=
```

> ⚠️ **Coordination rule:** Your Express `ml.service.js` must match the exact route paths your teammate exposes. Agree on these 3 endpoints before Week 3 ends:
> - `POST /ml/premium/calculate` → inputs: `{ zone_code, weekly_hours, season, claim_history }`
> - `POST /ml/fraud/score` → inputs: `{ worker_id, event_id, motion_data }`
> - `POST /ml/risk/profile` → inputs: `{ zone_code, worker_id }`

---

## `/supabase` — Migrations & Types

```
supabase/
│
├── migrations/
│   ├── 001_init_schema.sql       # All table creation
│   ├── 002_rls_policies.sql      # All RLS policies
│   └── 003_seed_zones.sql        # Zone risk scores seed data
│
├── functions/                    # Supabase Edge Functions (if used)
│   └── trigger-monitor/
│       └── index.ts
│
└── types/
    └── database.types.ts         # Auto-generated from Supabase CLI
```

---

## `/docs` — All Documentation

```
docs/
├── FOLDER_STRUCTURE.md     # This file
├── UI_DESIGN_PROMPT.md     # Stitch UI prompt
├── AGENT_CONTEXT.md        # AI agent understanding doc
├── SUPABASE_SETUP.md       # Schema + RLS guide
└── DEV_GUIDE.md            # Frontend + backend dev guide
```

---

## Root Config Files

### `.gitignore`
```
node_modules/
.env
.env.local
*.pkl
__pycache__/
.DS_Store
dist/
build/
.vercel/
```

### `render.yaml` — Multi-service Render config
```yaml
services:
  - type: web
    name: gigshield-server
    runtime: node
    rootDir: server
    buildCommand: npm install
    startCommand: node src/index.js
    envVars:
      - key: PORT
        value: 4000
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: ML_SERVICE_URL
        sync: false
      - key: OPENWEATHER_API_KEY
        sync: false
      - key: CLIENT_ORIGIN
        sync: false

  - type: web
    name: gigshield-ml
    runtime: python
    rootDir: ml-service
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn wsgi:app
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
```

### Root `package.json` (workspaces)
```json
{
  "name": "gigshield",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\""
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

---

## Deployment Checklist

| Step | Action | Who |
|---|---|---|
| 1 | Push monorepo to GitHub | You |
| 2 | Connect Vercel to `client/` with `VITE_API_BASE_URL` env | You |
| 3 | Create Render Service 1 from `server/` with `render.yaml` | You |
| 4 | Create Render Service 2 from `ml-service/` with `render.yaml` | Teammate |
| 5 | Run Supabase migrations via CLI | You |
| 6 | Set `ML_SERVICE_URL` in Render Service 1 to Service 2's URL | You |
| 7 | Set `CLIENT_ORIGIN` in Render Service 1 to Vercel URL | You |
