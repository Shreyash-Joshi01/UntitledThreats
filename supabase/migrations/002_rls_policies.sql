-- Migration 002: RLS Policies

alter table workers enable row level security;
alter table policies enable row level security;
alter table claims enable row level security;
alter table parametric_events enable row level security;
alter table zone_risk_scores enable row level security;
alter table premium_calculations enable row level security;

create or replace function get_worker_id()
returns uuid as $$
  select id from public.workers where user_id = auth.uid() limit 1;
$$ language sql security definer stable set search_path = '';

create policy "workers_select_own" on workers for select using (user_id = auth.uid());
create policy "workers_update_own" on workers for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "policies_select_own" on policies for select using (worker_id = get_worker_id());

create policy "claims_select_own" on claims for select using (worker_id = get_worker_id());
create policy "claims_update_appeal" on claims for update using (worker_id = get_worker_id()) with check (worker_id = get_worker_id());

create policy "events_select_authenticated" on parametric_events for select to authenticated using (is_active = true);

create policy "zone_scores_select_authenticated" on zone_risk_scores for select to authenticated using (true);

create policy "premium_select_own" on premium_calculations for select using (worker_id = get_worker_id());
