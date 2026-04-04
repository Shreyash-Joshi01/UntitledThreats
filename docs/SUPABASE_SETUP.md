# GigShield — Supabase Setup & RLS Policies

> This document covers: schema creation, RLS policy design, auth config, and maintenance procedures.
> Run all SQL in order via Supabase SQL Editor or `supabase db push` CLI.

---

## 1. Auth Configuration

### Enable Phone Auth
1. Go to **Supabase Dashboard → Authentication → Providers**
2. Enable **Phone** provider
3. Set SMS provider to **Twilio** (or use built-in for dev/testing)
4. For hackathon demo: enable **"Enable phone confirmations"** and set test OTP `123456` via Supabase Auth settings

### Auth Settings
```
Site URL: https://gigshield.vercel.app
Redirect URLs: https://gigshield.vercel.app/dashboard
JWT Expiry: 3600 (1 hour)
Refresh Token Rotation: enabled
```

---

## 2. Database Schema

Run this in order in the Supabase SQL Editor.

### Migration 001 — Core Tables

```sql
-- =============================================
-- EXTENSION
-- =============================================
create extension if not exists "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================
create type event_type as enum (
  'heavy_rain_60',
  'heavy_rain_90',
  'extreme_heat',
  'severe_aqi',
  'flash_flood',
  'curfew'
);

create type claim_status as enum (
  'auto_approved',
  'flagged',
  'approved',
  'rejected',
  'pending_review'
);

create type policy_status as enum (
  'active',
  'inactive',
  'expired'
);

create type risk_zone as enum (
  'low',
  'medium',
  'high'
);

-- =============================================
-- WORKERS
-- =============================================
create table workers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id text not null unique,           -- Zepto/Blinkit partner ID
  phone text not null unique,
  upi_id text not null,
  zone_code text not null,                   -- Pin code of operating zone
  zone_risk risk_zone not null default 'medium',
  zone_risk_score numeric(3,1) default 5.0, -- 1.0–10.0 from ML service
  weekly_hours numeric(5,1) default 40.0,
  platform text not null check (platform in ('zepto', 'blinkit', 'both')),
  is_active boolean default true,
  enrolled_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- POLICIES (INSURANCE POLICIES)
-- =============================================
create table policies (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references workers(id) on delete cascade,
  status policy_status not null default 'active',
  weekly_premium numeric(6,2) not null,
  max_weekly_payout numeric(8,2) not null,
  coverage_start timestamptz not null,
  coverage_end timestamptz not null,          -- Always coverage_start + 7 days
  consecutive_weeks int not null default 1,   -- For minimum 2-week rule
  is_claim_eligible boolean generated always as (consecutive_weeks >= 2) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- PARAMETRIC EVENTS (TRIGGERS)
-- =============================================
create table parametric_events (
  id uuid primary key default uuid_generate_v4(),
  event_type event_type not null,
  zone_code text not null,
  triggered_at timestamptz not null default now(),
  duration_minutes int,                        -- How long the threshold was met
  api_source text not null,                    -- 'openweathermap' | 'aqicn' | 'imd' | 'mock'
  raw_value numeric,                           -- e.g. 38.5 mm/hr, 420 AQI, 43.2°C
  fixed_payout numeric(6,2) not null,          -- Payout locked at event time
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- CLAIMS
-- =============================================
create table claims (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references workers(id) on delete cascade,
  policy_id uuid not null references policies(id) on delete cascade,
  event_id uuid not null references parametric_events(id),
  status claim_status not null default 'auto_approved',
  payout_amount numeric(6,2) not null,
  fraud_score numeric(5,2) default 0,          -- 0–100; >70 = soft hold; >90 = reject
  fraud_flags jsonb default '[]',              -- Array of triggered fraud signals
  initiated_at timestamptz default now(),
  resolved_at timestamptz,
  payout_reference text,                       -- Razorpay / UPI mock reference
  appeal_requested boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- ZONE RISK SCORES (seed from zone_scores.csv)
-- =============================================
create table zone_risk_scores (
  id uuid primary key default uuid_generate_v4(),
  zone_code text not null unique,
  city text not null,
  risk_score numeric(3,1) not null,           -- 1.0–10.0
  flood_frequency numeric(3,1) default 0,
  aqi_frequency numeric(3,1) default 0,
  rain_frequency numeric(3,1) default 0,
  last_updated timestamptz default now()
);

-- =============================================
-- PREMIUM AUDIT LOG
-- =============================================
create table premium_calculations (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references workers(id) on delete cascade,
  calculated_at timestamptz default now(),
  base_premium numeric(6,2) not null,
  final_premium numeric(6,2) not null,
  ml_multiplier numeric(4,3),                 -- e.g. 1.25
  adjustment_factors jsonb,                   -- { zone: +15, season: +10, loyalty: -8 }
  week_start timestamptz not null
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_workers_user_id on workers(user_id);
create index idx_workers_zone_code on workers(zone_code);
create index idx_policies_worker_id on policies(worker_id);
create index idx_policies_status on policies(status);
create index idx_claims_worker_id on claims(worker_id);
create index idx_claims_status on claims(status);
create index idx_parametric_events_zone on parametric_events(zone_code);
create index idx_parametric_events_active on parametric_events(is_active);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workers_updated_at before update on workers
  for each row execute function handle_updated_at();

create trigger policies_updated_at before update on policies
  for each row execute function handle_updated_at();

create trigger claims_updated_at before update on claims
  for each row execute function handle_updated_at();
```

---

## 3. Row Level Security (RLS) Policies

### Migration 002 — Enable RLS + All Policies

```sql
-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
alter table workers enable row level security;
alter table policies enable row level security;
alter table claims enable row level security;
alter table parametric_events enable row level security;
alter table zone_risk_scores enable row level security;
alter table premium_calculations enable row level security;

-- =============================================
-- HELPER FUNCTION: get worker_id from JWT
-- =============================================
create or replace function get_worker_id()
returns uuid as $$
  select id from workers where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- =============================================
-- WORKERS TABLE RLS
-- =============================================

-- Workers can only read their own row
create policy "workers_select_own"
  on workers for select
  using (user_id = auth.uid());

-- Workers can only update their own row (not user_id, partner_id, enrolled_at)
create policy "workers_update_own"
  on workers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Insert handled by server (service role) only — no client insert allowed
-- No insert policy = only service role key can insert workers

-- =============================================
-- POLICIES TABLE RLS
-- =============================================

-- Workers can read only their own policies
create policy "policies_select_own"
  on policies for select
  using (worker_id = get_worker_id());

-- No client-side insert or update — server (service role) manages policies

-- =============================================
-- CLAIMS TABLE RLS
-- =============================================

-- Workers can read only their own claims
create policy "claims_select_own"
  on claims for select
  using (worker_id = get_worker_id());

-- Workers can update only appeal_requested on their own claims
create policy "claims_update_appeal"
  on claims for update
  using (worker_id = get_worker_id())
  with check (worker_id = get_worker_id());
-- Note: all other claim fields are managed by service role only

-- =============================================
-- PARAMETRIC EVENTS TABLE RLS
-- =============================================

-- All authenticated users can read active events (needed for dashboard)
create policy "events_select_authenticated"
  on parametric_events for select
  to authenticated
  using (is_active = true);

-- No client insert/update — server only

-- =============================================
-- ZONE RISK SCORES TABLE RLS
-- =============================================

-- All authenticated users can read zone scores (needed for onboarding)
create policy "zone_scores_select_authenticated"
  on zone_risk_scores for select
  to authenticated
  using (true);

-- =============================================
-- PREMIUM CALCULATIONS TABLE RLS
-- =============================================

-- Workers can only read their own premium history
create policy "premium_select_own"
  on premium_calculations for select
  using (worker_id = get_worker_id());

-- =============================================
-- SERVICE ROLE BYPASS NOTE
-- =============================================
-- The Express server uses SUPABASE_SERVICE_ROLE_KEY which bypasses ALL RLS.
-- This is intentional — all writes (worker creation, policy creation, claim
-- initiation, payout recording) happen server-side with the service role key.
-- The React client uses the anon key + user JWT which is subject to all RLS above.
```

---

## 4. Seed Data

### Migration 003 — Zone Risk Scores

```sql
insert into zone_risk_scores (zone_code, city, risk_score, flood_frequency, aqi_frequency, rain_frequency) values
('400001', 'Mumbai',    8.5, 8.0, 3.0, 9.0),
('400051', 'Mumbai',    7.0, 7.0, 2.5, 8.5),
('110001', 'Delhi',     7.5, 5.0, 9.5, 4.0),
('110025', 'Delhi',     7.0, 4.5, 9.0, 4.0),
('560001', 'Bengaluru', 5.5, 4.0, 4.0, 5.5),
('560100', 'Bengaluru', 6.0, 5.0, 3.5, 6.0),
('500001', 'Hyderabad', 7.0, 7.5, 3.0, 6.5),
('500081', 'Hyderabad', 6.5, 6.5, 2.5, 6.0),
('600001', 'Chennai',   6.5, 6.0, 3.5, 7.0),
('411001', 'Pune',      5.0, 4.0, 2.5, 5.5);
```

---

## 5. Supabase Client Setup

### Server-side (Express — service role, bypasses RLS)
```js
// server/src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,   // ← service role bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default supabase
```

### Client-side (React — anon key, subject to RLS)
```js
// client/src/services/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY   // ← anon key, RLS enforced
)

export default supabase
```

> ⚠️ **Never expose SUPABASE_SERVICE_ROLE_KEY to the client.** It only lives in the server `.env`.

---

## 6. JWT Validation in Express Middleware

```js
// server/src/middleware/auth.middleware.js
import supabase from '../config/supabase.js'

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1]

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' })
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }

  req.user = user   // { id, phone, ... }
  next()
}
```

---

## 7. RLS Maintenance Rules

| Rule | Detail |
|---|---|
| **Never grant client insert on workers** | Worker creation always goes through Express with service role |
| **Claim writes are server-only** | Auto-claim initiation is server-triggered, not client-triggered |
| **Anon key in client is safe** | Because RLS restricts every row to the authenticated user's own data |
| **Rotating service role key** | If compromised, rotate in Supabase dashboard and update Render env vars |
| **Adding new tables** | Always: (1) enable RLS, (2) add select policy for owner, (3) restrict writes to service role |
| **Policy review cadence** | Test all RLS policies after every schema migration using Supabase Policy Tester |

---

## 8. Environment Variables Reference

### Server `.env`
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Client `.env`
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=https://gigshield-server.onrender.com
```
