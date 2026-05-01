alter table profiles alter column role set default 'user';

update profiles set role = 'user' where role::text = 'authenticated';
update profiles set role = 'merchant' where role::text = 'merchant_admin';

create or replace function current_app_role() returns text language sql stable as $$
  select case coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
    when 'authenticated' then 'user'
    when 'merchant_admin' then 'merchant'
    else coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
  end;
$$;

do $$ declare t text; begin
  foreach t in array array[
    'countries','regions','categories','brands','products','stores','store_locations','source_feeds',
    'price_observations','price_current','merchant_accounts','merchant_store_access','subscriptions',
    'referrals','api_keys','audit_logs','profiles','prices','shares','reports','user_favorites',
    'price_alerts','product_links','product_clicks','monetization_events','premium_orders',
    'source_jobs','raw_source_payloads'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

do $$ declare t text; p text; begin
  foreach t in array array[
    'countries','regions','categories','brands','products','stores','store_locations','source_feeds',
    'price_observations','price_current','merchant_accounts','merchant_store_access','subscriptions',
    'referrals','api_keys','audit_logs','profiles','prices','shares','reports','user_favorites',
    'price_alerts','product_links','product_clicks','monetization_events','premium_orders',
    'source_jobs','raw_source_payloads'
  ] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on %I', p, t);
    end loop;
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['countries','regions','categories','brands','products','stores','store_locations','source_feeds','price_observations','price_current','product_links'] loop
    execute format('create policy public_read on %I for select using (true)', t);
  end loop;
end $$;

create policy profiles_read on profiles
  for select using (auth.uid() = id or current_app_role() in ('admin','moderator'));
create policy profiles_update on profiles
  for update using (auth.uid() = id or current_app_role() = 'admin')
  with check (auth.uid() = id or current_app_role() = 'admin');
create policy profiles_admin_insert on profiles
  for insert with check (current_app_role() = 'admin' or auth.uid() = id);

create policy community_prices_read on prices
  for select using (status = 'approved' or auth.uid() = user_id or current_app_role() in ('admin','moderator'));
create policy community_prices_insert on prices
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
create policy community_prices_moderate on prices
  for update using (current_app_role() in ('admin','moderator'))
  with check (current_app_role() in ('admin','moderator'));

create policy own_favorites_all on user_favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy own_alerts_all on price_alerts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy own_reports_insert on reports
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
create policy own_reports_read on reports
  for select using (auth.uid() = user_id or current_app_role() in ('admin','moderator'));
create policy admin_moderate_reports on reports
  for update using (current_app_role() in ('admin','moderator'))
  with check (current_app_role() in ('admin','moderator'));

create policy own_subscriptions_read on subscriptions
  for select using (auth.uid() = user_id or current_app_role() = 'admin');
create policy admin_subscriptions_all on subscriptions
  for all using (current_app_role() = 'admin')
  with check (current_app_role() = 'admin');

create policy merchant_accounts_read on merchant_accounts
  for select using (owner_user_id = auth.uid() or current_app_role() = 'admin');
create policy merchant_store_access_read on merchant_store_access
  for select using (user_id = auth.uid() or current_app_role() = 'admin');
create policy merchant_store_update on stores
  for update using (
    current_app_role() = 'admin'
    or exists (
      select 1 from merchant_store_access msa
      where msa.store_id = stores.id
        and msa.user_id = auth.uid()
        and current_app_role() = 'merchant'
    )
  ) with check (
    current_app_role() = 'admin'
    or exists (
      select 1 from merchant_store_access msa
      where msa.store_id = stores.id
        and msa.user_id = auth.uid()
        and current_app_role() = 'merchant'
    )
  );

do $$ declare t text; begin
  foreach t in array array['source_jobs','raw_source_payloads','price_observations','price_current','audit_logs'] loop
    execute format('create policy admin_internal_all on %I for all using (current_app_role() in (''admin'',''internal_job'')) with check (current_app_role() in (''admin'',''internal_job''))', t);
  end loop;
end $$;

create policy monetization_admin_read on monetization_events
  for select using (current_app_role() = 'admin');
create policy product_clicks_insert on product_clicks
  for insert with check (true);
create policy shares_insert on shares
  for insert with check (auth.uid() = user_id or user_id is null);
create policy premium_orders_admin_read on premium_orders
  for select using (current_app_role() = 'admin');
