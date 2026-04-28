create extension if not exists pgcrypto;

create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product text not null,
  normalized_product text not null,
  display_name text not null,
  brand text not null default 'Sin marca',
  category text not null default 'General',
  unit text not null default 'unidad',
  store text not null,
  neighborhood text not null default 'Cerca tuyo',
  price numeric(12, 2) not null check (price > 0),
  currency text not null default 'UYU',
  status text not null default 'approved' check (status in ('approved', 'pending', 'hidden')),
  trust_score int not null default 70 check (trust_score >= 0 and trust_score <= 100),
  reports int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  price_id uuid references public.prices(id) on delete set null,
  normalized_product text not null,
  channel text not null default 'share',
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  price_id uuid references public.prices(id) on delete set null,
  normalized_product text not null,
  store text,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.monetization_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  source text,
  value numeric(12, 2),
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
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists provider text;
alter table public.profiles add column if not exists city text default 'Montevideo';
alter table public.profiles add column if not exists neighborhood text;
alter table public.profiles add column if not exists points int not null default 0;
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists paypal_order_id text;
alter table public.profiles add column if not exists is_premium boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_product text not null,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_product)
);

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_product text not null,
  neighborhood text,
  target_price numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_product, neighborhood)
);

create table if not exists public.product_links (
  id uuid primary key default gen_random_uuid(),
  normalized_product text not null,
  title text not null,
  store text not null,
  url text not null,
  kind text not null default 'affiliate' check (kind in ('affiliate', 'sponsored', 'organic')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_link_id uuid references public.product_links(id) on delete set null,
  normalized_product text not null,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references auth.users(id) on delete set null,
  channel text,
  normalized_product text,
  created_at timestamptz not null default now()
);

create index if not exists prices_lookup_idx
  on public.prices (normalized_product, neighborhood, status, price);

create index if not exists prices_recent_idx
  on public.prices (status, created_at desc);

create index if not exists shares_product_idx
  on public.shares (normalized_product, created_at desc);

create index if not exists reports_status_idx
  on public.reports (status, created_at desc);

create index if not exists monetization_events_type_idx
  on public.monetization_events (type, created_at desc);

create index if not exists premium_orders_status_idx
  on public.premium_orders (status, created_at desc);

create index if not exists product_links_lookup_idx
  on public.product_links (normalized_product, active, kind);

create index if not exists product_clicks_product_idx
  on public.product_clicks (normalized_product, created_at desc);

create index if not exists price_alerts_user_idx
  on public.price_alerts (user_id, active);

alter table public.prices enable row level security;
alter table public.shares enable row level security;
alter table public.reports enable row level security;
alter table public.monetization_events enable row level security;
alter table public.premium_orders enable row level security;
alter table public.profiles enable row level security;
alter table public.user_favorites enable row level security;
alter table public.price_alerts enable row level security;
alter table public.product_links enable row level security;
alter table public.product_clicks enable row level security;
alter table public.referral_events enable row level security;

drop policy if exists "approved prices are public" on public.prices;
create policy "approved prices are public"
  on public.prices for select
  using (status = 'approved');

drop policy if exists "authenticated users create prices" on public.prices;
create policy "authenticated users create prices"
  on public.prices for insert
  with check (auth.uid() = user_id and status in ('approved', 'pending'));

drop policy if exists "owners update own prices" on public.prices;
create policy "owners update own prices"
  on public.prices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated users create shares" on public.shares;
create policy "authenticated users create shares"
  on public.shares for insert
  with check (auth.uid() = user_id);

drop policy if exists "owners read shares" on public.shares;
create policy "owners read shares"
  on public.shares for select
  using (auth.uid() = user_id);

drop policy if exists "authenticated users create reports" on public.reports;
create policy "authenticated users create reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "owners read reports" on public.reports;
create policy "owners read reports"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "service manages monetization events" on public.monetization_events;
create policy "service manages monetization events"
  on public.monetization_events for all
  using (false)
  with check (false);

drop policy if exists "service manages premium orders" on public.premium_orders;
create policy "service manages premium orders"
  on public.premium_orders for all
  using (false)
  with check (false);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users manage own favorites" on public.user_favorites;
create policy "users manage own favorites"
  on public.user_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own alerts" on public.price_alerts;
create policy "users manage own alerts"
  on public.price_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "active product links public" on public.product_links;
create policy "active product links public"
  on public.product_links for select
  using (active = true);

drop policy if exists "service manages product clicks" on public.product_clicks;
create policy "service manages product clicks"
  on public.product_clicks for all
  using (false)
  with check (false);

drop policy if exists "authenticated users create referral events" on public.referral_events;
create policy "authenticated users create referral events"
  on public.referral_events for insert
  with check (auth.uid() = referrer_user_id or referrer_user_id is null);
