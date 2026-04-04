-- Migration 001: Core Schema
-- Run this first in Supabase SQL editor or via CLI

create extension if not exists "uuid-ossp";

create type event_type as enum ('heavy_rain_60','heavy_rain_90','extreme_heat','severe_aqi','flash_flood','curfew');
create type claim_status as enum ('auto_approved','flagged','approved','rejected','pending_review');
create type policy_status as enum ('active','inactive','expired');
create type risk_zone as enum ('low','medium','high');

create table workers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id text not null unique,
  phone text not null unique,
  upi_id text not null,
  zone_code text not null,
  zone_risk risk_zone not null default 'medium',
  zone_risk_score numeric(3,1) default 5.0,
  weekly_hours numeric(5,1) default 40.0,
  platform text not null check (platform in ('zepto', 'blinkit', 'both')),
  is_active boolean default true,
  enrolled_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table policies (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references workers(id) on delete cascade,
  status policy_status not null default 'active',
  weekly_premium numeric(6,2) not null,
  max_weekly_payout numeric(8,2) not null,
  coverage_start timestamptz not null,
  coverage_end timestamptz not null,
  consecutive_weeks int not null default 1,
  is_claim_eligible boolean generated always as (consecutive_weeks >= 2) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table parametric_events (
  id uuid primary key default uuid_generate_v4(),
  event_type event_type not null,
  zone_code text not null,
  triggered_at timestamptz not null default now(),
  duration_minutes int,
  api_source text not null,
  raw_value numeric,
  fixed_payout numeric(6,2) not null,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table claims (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references workers(id) on delete cascade,
  policy_id uuid not null references policies(id) on delete cascade,
  event_id uuid not null references parametric_events(id),
  status claim_status not null default 'auto_approved',
  payout_amount numeric(6,2) not null,
  fraud_score numeric(5,2) default 0,
  fraud_flags jsonb default '[]',
  initiated_at timestamptz default now(),
  resolved_at timestamptz,
  payout_reference text,
  appeal_requested boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table zone_risk_scores (
  id uuid primary key default uuid_generate_v4(),
  zone_code text not null unique,
  city text not null,
  risk_score numeric(3,1) not null,
  flood_frequency numeric(3,1) default 0,
  aqi_frequency numeric(3,1) default 0,
  rain_frequency numeric(3,1) default 0,
  last_updated timestamptz default now()
);

create table premium_calculations (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references workers(id) on delete cascade,
  calculated_at timestamptz default now(),
  base_premium numeric(6,2) not null,
  final_premium numeric(6,2) not null,
  ml_multiplier numeric(4,3),
  adjustment_factors jsonb,
  week_start timestamptz not null
);

create index idx_workers_user_id on workers(user_id);
create index idx_workers_zone_code on workers(zone_code);
create index idx_policies_worker_id on policies(worker_id);
create index idx_policies_status on policies(status);
create index idx_claims_worker_id on claims(worker_id);
create index idx_claims_status on claims(status);
create index idx_parametric_events_zone on parametric_events(zone_code);
create index idx_parametric_events_active on parametric_events(is_active);

create or replace function handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql set search_path = '';

create trigger workers_updated_at before update on workers for each row execute function handle_updated_at();
create trigger policies_updated_at before update on policies for each row execute function handle_updated_at();
create trigger claims_updated_at before update on claims for each row execute function handle_updated_at();
