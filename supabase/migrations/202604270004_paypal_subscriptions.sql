alter table profiles add column if not exists paypal_subscription_id text;
alter table subscriptions add column if not exists provider_plan_id text;
alter table subscriptions add column if not exists last_event_type text;
alter table subscriptions add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists idx_subscriptions_provider_subscription_id
  on subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;
