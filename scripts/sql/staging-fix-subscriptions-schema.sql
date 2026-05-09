-- AhorroYA staging-only subscriptions schema repair proposal.
-- Do not run against production.
-- Purpose: expose public.subscriptions to Supabase REST/PostgREST with the
-- columns expected by server/api/paypal/_utils.js updateSubscriptionRecord().
-- This script is idempotent and does not delete subscription rows.

begin;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paypal',
  provider_subscription_id text,
  provider_plan_id text,
  plan_code text not null default 'premium_monthly',
  status text not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_event_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions add column if not exists provider text not null default 'paypal';
alter table public.subscriptions add column if not exists provider_subscription_id text;
alter table public.subscriptions add column if not exists provider_plan_id text;
alter table public.subscriptions add column if not exists plan_code text not null default 'premium_monthly';
alter table public.subscriptions add column if not exists current_period_start timestamptz;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists last_event_type text;
alter table public.subscriptions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

-- Compatibility with the older monetization_v2 migration shape.
-- These columns may exist in some environments with NOT NULL constraints that
-- are incompatible with the current PayPal webhook payload. Keep the columns,
-- but make them optional so webhook writes can use the provider_* contract.
alter table public.subscriptions add column if not exists paypal_subscription_id text;
alter table public.subscriptions add column if not exists plan text;
alter table public.subscriptions add column if not exists expires_at timestamptz;
alter table public.subscriptions add column if not exists amount_paid numeric(10, 2);
alter table public.subscriptions add column if not exists currency text default 'USD';
alter table public.subscriptions add column if not exists last_payment_at timestamptz;
alter table public.subscriptions add column if not exists next_payment_at timestamptz;
alter table public.subscriptions alter column paypal_subscription_id drop not null;
alter table public.subscriptions alter column plan drop not null;
alter table public.subscriptions alter column expires_at drop not null;
alter table public.subscriptions alter column amount_paid drop not null;
alter table public.subscriptions alter column currency drop not null;

create unique index if not exists idx_subscriptions_provider_subscription_id
  on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.subscriptions to authenticated;
grant select, insert, update on public.subscriptions to service_role;

drop policy if exists own_subscriptions_read on public.subscriptions;
drop policy if exists admin_subscriptions_all on public.subscriptions;
drop policy if exists internal_job_subscriptions_all on public.subscriptions;

create policy own_subscriptions_read on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id or public.current_app_role() = 'admin');

create policy admin_subscriptions_all on public.subscriptions
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy internal_job_subscriptions_all on public.subscriptions
  for all to authenticated
  using (public.current_app_role() = 'internal_job')
  with check (public.current_app_role() = 'internal_job');

notify pgrst, 'reload schema';

commit;
