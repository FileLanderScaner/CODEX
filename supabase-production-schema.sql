create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  provider text,
  city text default 'Montevideo',
  neighborhood text,
  points int not null default 0,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  premium_until timestamptz,
  paypal_order_id text,
  paypal_subscription_id text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists paypal_subscription_id text;
alter table public.profiles add column if not exists is_premium boolean not null default false;
alter table public.profiles add column if not exists premium_until timestamptz;

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text,
  normalized_product text not null,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_product)
);

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text,
  normalized_product text not null,
  neighborhood text,
  target_price numeric(12, 2),
  currency text not null default 'UYU',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_product, neighborhood)
);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  normalized_product text,
  amount numeric(12, 2),
  currency text not null default 'UYU',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.price_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  normalized_product text,
  amount numeric(12, 2),
  currency text not null default 'UYU',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.monetization_events (
  id uuid primary key default gen_random_uuid(),
  event_name text,
  event_type text,
  type text,
  user_id uuid references auth.users(id) on delete set null,
  amount numeric(12, 2),
  currency text not null default 'UYU',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.premium_orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paypal',
  provider_order_id text not null unique,
  user_id text,
  email text,
  amount numeric(12, 2),
  currency text not null default 'USD',
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_favorites enable row level security;
alter table public.price_alerts enable row level security;
alter table public.search_events enable row level security;
alter table public.price_events enable row level security;
alter table public.monetization_events enable row level security;
alter table public.premium_orders enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users manage own favorites" on public.user_favorites;
create policy "users manage own favorites" on public.user_favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own alerts" on public.price_alerts;
create policy "users manage own alerts" on public.price_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users create search events" on public.search_events;
create policy "users create search events" on public.search_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "users read own search events" on public.search_events;
create policy "users read own search events" on public.search_events for select using (auth.uid() = user_id);

drop policy if exists "users create price events" on public.price_events;
create policy "users create price events" on public.price_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "users read own price events" on public.price_events;
create policy "users read own price events" on public.price_events for select using (auth.uid() = user_id);

drop policy if exists "service manages monetization events" on public.monetization_events;
create policy "service manages monetization events" on public.monetization_events for all using (false) with check (false);

drop policy if exists "service manages premium orders" on public.premium_orders;
create policy "service manages premium orders" on public.premium_orders for all using (false) with check (false);

create index if not exists search_events_lookup_idx on public.search_events (event_name, normalized_product, created_at desc);
create index if not exists price_events_lookup_idx on public.price_events (event_name, normalized_product, created_at desc);
create index if not exists user_favorites_user_idx on public.user_favorites (user_id, created_at desc);
create index if not exists price_alerts_user_idx on public.price_alerts (user_id, active);
