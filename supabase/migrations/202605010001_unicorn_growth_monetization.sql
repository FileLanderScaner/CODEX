create table if not exists user_savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_name text not null,
  search_query text not null,
  cheapest_store text not null,
  cheapest_price numeric(14,2) not null check (cheapest_price >= 0),
  expensive_store text not null,
  expensive_price numeric(14,2) not null check (expensive_price >= cheapest_price),
  savings_amount numeric(14,2) generated always as (expensive_price - cheapest_price) stored,
  currency text not null default 'UYU' check (char_length(currency) = 3),
  created_at timestamptz not null default now()
);

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product text,
  store text not null,
  target_url text not null,
  campaign text not null default 'organic',
  referrer text,
  converted_at timestamptz,
  revenue_estimate numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_name text not null,
  slot text not null,
  category text,
  product text,
  target_url text,
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  budget numeric(14,2),
  created_at timestamptz not null default now()
);

create table if not exists ad_impressions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references ad_campaigns(id) on delete set null,
  user_id uuid,
  slot text not null,
  product text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists ad_clicks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references ad_campaigns(id) on delete set null,
  user_id uuid,
  slot text not null,
  product text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists commercial_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  segment text not null default 'other',
  message text not null,
  status text not null default 'new' check (status in ('new','qualified','contacted','won','lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists referral_invites (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null,
  referred_user_id uuid,
  code text not null,
  channel text not null default 'link',
  status text not null default 'clicked' check (status in ('created','clicked','signed_up','rewarded','expired')),
  reward_config jsonb not null default '{"type":"premium_days","value":7}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code, referred_user_id)
);

create table if not exists notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  channel text not null check (channel in ('email','whatsapp','push')),
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  provider_message_id text,
  error_message text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_savings_user_month on user_savings(user_id, created_at desc);
create index if not exists idx_affiliate_clicks_product_store on affiliate_clicks(product, store, created_at desc);
create index if not exists idx_ad_impressions_campaign on ad_impressions(campaign_id, created_at desc);
create index if not exists idx_ad_clicks_campaign on ad_clicks(campaign_id, created_at desc);
create index if not exists idx_commercial_leads_status on commercial_leads(status, created_at desc);
create index if not exists idx_referral_invites_code on referral_invites(code);
create index if not exists idx_notification_queue_status on notification_queue(status, scheduled_at);

create or replace function get_user_monthly_savings(p_user_id uuid, p_month_offset integer default 0)
returns table(total_savings numeric, count_searches bigint, avg_savings_per_search numeric)
language sql
stable
as $$
  with bounds as (
    select
      date_trunc('month', now()) - make_interval(months => p_month_offset) as starts_at,
      date_trunc('month', now()) - make_interval(months => p_month_offset - 1) as ends_at
  )
  select
    coalesce(sum(savings_amount), 0)::numeric as total_savings,
    count(*)::bigint as count_searches,
    coalesce(avg(savings_amount), 0)::numeric as avg_savings_per_search
  from user_savings, bounds
  where user_id = p_user_id
    and created_at >= bounds.starts_at
    and created_at < bounds.ends_at;
$$;

alter table user_savings enable row level security;
alter table affiliate_clicks enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_impressions enable row level security;
alter table ad_clicks enable row level security;
alter table commercial_leads enable row level security;
alter table referral_invites enable row level security;
alter table notification_queue enable row level security;

create policy own_user_savings on user_savings for all using (auth.uid() = user_id or current_app_role() = 'admin') with check (auth.uid() = user_id or current_app_role() = 'admin');
create policy own_affiliate_clicks_read on affiliate_clicks for select using (auth.uid() = user_id or current_app_role() = 'admin');
create policy service_affiliate_clicks_insert on affiliate_clicks for insert with check (true);
create policy active_ad_campaigns_read on ad_campaigns for select using (status = 'active' or current_app_role() = 'admin');
create policy ad_impressions_insert on ad_impressions for insert with check (true);
create policy ad_clicks_insert on ad_clicks for insert with check (true);
create policy admin_ad_metrics_read on ad_impressions for select using (current_app_role() = 'admin');
create policy admin_ad_clicks_read on ad_clicks for select using (current_app_role() = 'admin');
create policy commercial_leads_insert on commercial_leads for insert with check (true);
create policy admin_commercial_leads on commercial_leads for all using (current_app_role() = 'admin');
create policy own_referral_invites on referral_invites for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id or current_app_role() = 'admin');
create policy own_referral_invites_insert on referral_invites for insert with check (auth.uid() = referrer_user_id or current_app_role() = 'admin');
create policy own_notifications on notification_queue for select using (auth.uid() = user_id or current_app_role() = 'admin');
