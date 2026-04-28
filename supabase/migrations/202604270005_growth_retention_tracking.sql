alter table user_favorites add column if not exists normalized_product text;
alter table price_alerts add column if not exists normalized_product text;
alter table price_alerts add column if not exists neighborhood text;
alter table price_alerts add column if not exists active boolean not null default true;

create index if not exists idx_user_favorites_user_product on user_favorites(user_id, normalized_product);
create index if not exists idx_price_alerts_user_product on price_alerts(user_id, normalized_product, active);
create index if not exists idx_monetization_events_name_created on monetization_events(event_name, created_at desc);
create index if not exists idx_shares_product_created on shares(product, created_at desc);

do $$ begin
  alter table user_favorites add constraint user_favorites_user_normalized_unique unique(user_id, normalized_product);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table price_alerts add constraint price_alerts_user_normalized_neighborhood_unique unique(user_id, normalized_product, neighborhood);
exception when duplicate_object then null; end $$;

drop policy if exists monetization_events_insert on monetization_events;
create policy monetization_events_insert on monetization_events
  for insert with check (true);
