create extension if not exists pgcrypto;
create extension if not exists unaccent;

do $$ begin
  create type app_role as enum ('anon','authenticated','moderator','admin','merchant_admin','internal_job');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum ('pending','approved','rejected','hidden');
exception when duplicate_object then null; end $$;

create table if not exists countries (
  code text primary key check (char_length(code) = 2),
  name text not null,
  currency text not null check (char_length(currency) = 3),
  created_at timestamptz not null default now()
);

create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references countries(code),
  name text not null,
  external_code text,
  created_at timestamptz not null default now(),
  unique(country_code, name)
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  normalized_name text generated always as (lower(unaccent(name))) stored,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  brand_id uuid references brands(id),
  name text not null,
  normalized_name text generated always as (lower(unaccent(name))) stored,
  barcode text,
  default_unit text not null default 'unidad',
  moderation_status moderation_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(normalized_name, barcode)
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (lower(unaccent(name))) stored,
  country_code text references countries(code),
  merchant_account_id uuid,
  created_at timestamptz not null default now(),
  unique(normalized_name, country_code)
);

create table if not exists store_locations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  region_id uuid references regions(id),
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now()
);

create table if not exists source_feeds (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  country_code text references countries(code),
  name text not null,
  source_type text not null check (source_type in ('html','pdf','excel','csv','ckan','soap','api')),
  url text not null,
  schedule text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists source_jobs (
  id uuid primary key default gen_random_uuid(),
  source_feed_id uuid references source_feeds(id),
  source_code text not null,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  rows_downloaded integer not null default 0,
  rows_normalized integer not null default 0,
  inserted integer not null default 0,
  latest_updated integer not null default 0,
  retry_count integer not null default 0,
  error_message text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists raw_source_payloads (
  id uuid primary key default gen_random_uuid(),
  source_job_id uuid references source_jobs(id) on delete set null,
  source_code text not null,
  payload_checksum text not null unique,
  content_type text,
  storage_path text,
  payload jsonb,
  received_at timestamptz not null default now()
);

create table if not exists price_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  store_id uuid references stores(id),
  region_id uuid references regions(id),
  raw_payload_id uuid references raw_source_payloads(id),
  source_code text not null,
  country_code text not null references countries(code),
  product_name text not null,
  normalized_product text not null,
  store_name text not null,
  normalized_store text not null,
  region_name text not null,
  price numeric(14,2) not null check (price > 0),
  currency text not null check (char_length(currency) = 3),
  unit text not null,
  observed_at timestamptz not null,
  effective_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  quality_score numeric(5,2) not null default 90,
  moderation_status moderation_status not null default 'approved',
  idempotency_key text not null unique,
  payload_checksum text not null,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists price_current (
  id uuid primary key default gen_random_uuid(),
  source_code text not null,
  country_code text not null references countries(code),
  normalized_product text not null,
  normalized_store text not null,
  price numeric(14,2) not null,
  currency text not null check (char_length(currency) = 3),
  unit text not null,
  observed_at timestamptz not null,
  quality_score numeric(5,2) not null default 90,
  moderation_status moderation_status not null default 'approved',
  idempotency_key text not null,
  updated_at timestamptz not null default now(),
  unique(source_code, country_code, normalized_product, normalized_store, unit)
);

create table if not exists merchant_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists merchant_store_access (
  id uuid primary key default gen_random_uuid(),
  merchant_account_id uuid not null references merchant_accounts(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'merchant_admin',
  created_at timestamptz not null default now(),
  unique(merchant_account_id, store_id, user_id)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null default 'paypal',
  provider_subscription_id text,
  plan_code text not null,
  status text not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid,
  referred_user_id uuid,
  code text not null,
  status text not null default 'pending',
  reward_amount numeric(12,2),
  currency text default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  merchant_account_id uuid references merchant_accounts(id),
  name text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  action text not null,
  entity_table text,
  entity_id text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  email text,
  plan text default 'free',
  is_premium boolean not null default false,
  premium_until timestamptz,
  role app_role not null default 'authenticated',
  created_at timestamptz not null default now()
);

create table if not exists prices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product text not null,
  normalized_product text not null,
  display_name text not null,
  brand text,
  category text,
  unit text,
  store text not null,
  neighborhood text,
  price numeric(14,2) not null,
  currency text not null default 'UYU',
  status text not null default 'pending',
  trust_score integer not null default 70,
  reports integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists shares (id uuid primary key default gen_random_uuid(), user_id uuid, price_id uuid, product text, channel text, created_at timestamptz not null default now());
create table if not exists reports (id uuid primary key default gen_random_uuid(), user_id uuid, price_id uuid, product text, store text, reason text, status text not null default 'open', created_at timestamptz not null default now());
create table if not exists user_favorites (id uuid primary key default gen_random_uuid(), user_id uuid not null, product text, price_id uuid, created_at timestamptz not null default now());
create table if not exists price_alerts (id uuid primary key default gen_random_uuid(), user_id uuid not null, product text not null, target_price numeric(14,2) not null, currency text not null default 'UYU', created_at timestamptz not null default now());
create table if not exists product_links (id uuid primary key default gen_random_uuid(), product text not null, url text not null, label text, sponsored boolean not null default false, created_at timestamptz not null default now());
create table if not exists product_clicks (id uuid primary key default gen_random_uuid(), user_id uuid, product text, product_link_id uuid, signed_ref text, created_at timestamptz not null default now());
create table if not exists monetization_events (id uuid primary key default gen_random_uuid(), user_id uuid, event_name text not null, amount numeric(14,2), currency text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists premium_orders (id uuid primary key default gen_random_uuid(), user_id uuid, email text, provider text not null default 'paypal', provider_order_id text unique, amount numeric(14,2), currency text, status text not null, created_at timestamptz not null default now());

create index if not exists idx_products_search on products using gin (to_tsvector('spanish', name));
create index if not exists idx_price_observations_product_date on price_observations(normalized_product, observed_at desc);
create index if not exists idx_price_observations_location_date on price_observations(country_code, region_name, observed_at desc);
create index if not exists idx_price_current_lookup on price_current(country_code, normalized_product, normalized_store);
create index if not exists idx_prices_community_lookup on prices(normalized_product, store, created_at desc);

create or replace view latest_prices as
select distinct on (country_code, normalized_product, normalized_store, unit)
  *
from price_observations
where moderation_status = 'approved'
order by country_code, normalized_product, normalized_store, unit, observed_at desc;

create or replace view price_aggregates_daily as
select country_code, normalized_product, currency, date_trunc('day', observed_at) as day,
       min(price) as min_price, avg(price) as avg_price, max(price) as max_price, count(*) as observations
from price_observations
where moderation_status = 'approved'
group by country_code, normalized_product, currency, date_trunc('day', observed_at);

insert into countries(code, name, currency) values
  ('UY','Uruguay','UYU'), ('CL','Chile','CLP'), ('CO','Colombia','COP'), ('MX','Mexico','MXN')
on conflict (code) do nothing;

insert into source_feeds(code, country_code, name, source_type, url, schedule) values
  ('uy_uam_mgap','UY','UAM/MGAP precios mayoristas','html','https://www.uam.com.uy/','lunes y jueves despues de publicacion'),
  ('cl_odepa','CL','ODEPA datos abiertos precios','ckan','https://datos.odepa.gob.cl/','mayorista diario habil; consumidor semanal'),
  ('co_sipsa','CO','DANE SIPSA SOAP','soap','http://appweb.dane.gov.co/sipsaWS/SrvSipsaUpraBeanService?wsdl','posterior a 14:00 local'),
  ('mx_profeco_qqp','MX','PROFECO QQP datos abiertos','csv','https://datos.profeco.gob.mx/datos_abiertos/qqp.php','mensual o nuevo recurso')
on conflict (code) do nothing;

alter table countries enable row level security;
alter table regions enable row level security;
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table stores enable row level security;
alter table store_locations enable row level security;
alter table source_feeds enable row level security;
alter table source_jobs enable row level security;
alter table raw_source_payloads enable row level security;
alter table price_observations enable row level security;
alter table price_current enable row level security;
alter table merchant_accounts enable row level security;
alter table merchant_store_access enable row level security;
alter table subscriptions enable row level security;
alter table referrals enable row level security;
alter table api_keys enable row level security;
alter table audit_logs enable row level security;
alter table profiles enable row level security;
alter table prices enable row level security;
alter table shares enable row level security;
alter table reports enable row level security;
alter table user_favorites enable row level security;
alter table price_alerts enable row level security;
alter table product_links enable row level security;
alter table product_clicks enable row level security;
alter table monetization_events enable row level security;
alter table premium_orders enable row level security;

create or replace function current_app_role() returns text language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), (auth.jwt() -> 'user_metadata' ->> 'role'), 'anon');
$$;

do $$ declare t text; begin
  foreach t in array array['countries','regions','categories','brands','products','stores','store_locations','source_feeds','price_observations','price_current','product_links'] loop
    execute format('drop policy if exists public_read on %I', t);
    execute format('create policy public_read on %I for select using (true)', t);
  end loop;
end $$;

create policy own_profile_read on profiles for select using (auth.uid() = id or current_app_role() in ('admin','moderator'));
create policy own_profile_update on profiles for update using (auth.uid() = id or current_app_role() = 'admin');
create policy community_prices_insert on prices for insert with check (auth.role() = 'authenticated');
create policy community_prices_read on prices for select using (status = 'approved' or auth.uid() = user_id or current_app_role() in ('admin','moderator'));
create policy own_favorites_all on user_favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_alerts_all on price_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_subscriptions_read on subscriptions for select using (auth.uid() = user_id or current_app_role() = 'admin');
create policy own_reports_insert on reports for insert with check (auth.uid() = user_id);
create policy admin_all_reports on reports for all using (current_app_role() in ('admin','moderator'));
create policy admin_internal_jobs on source_jobs for all using (current_app_role() in ('admin','internal_job'));
create policy admin_raw_payloads on raw_source_payloads for all using (current_app_role() in ('admin','internal_job'));
create policy admin_observation_write on price_observations for all using (current_app_role() in ('admin','internal_job','moderator'));
create policy admin_current_write on price_current for all using (current_app_role() in ('admin','internal_job','moderator'));
create policy admin_audit_read on audit_logs for select using (current_app_role() = 'admin');
