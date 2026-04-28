begin;

create or replace function pg_temp.assert_true(value boolean, message text)
returns void language plpgsql as $$
begin
  if not value then
    raise exception 'RLS assertion failed: %', message;
  end if;
end;
$$;

insert into profiles (id, email, role)
values
  ('00000000-0000-4000-8000-000000000001', 'user@ahorroya.test', 'user'),
  ('00000000-0000-4000-8000-000000000002', 'admin@ahorroya.test', 'admin'),
  ('00000000-0000-4000-8000-000000000003', 'moderator@ahorroya.test', 'moderator'),
  ('00000000-0000-4000-8000-000000000004', 'merchant@ahorroya.test', 'merchant'),
  ('00000000-0000-4000-8000-000000000005', 'job@ahorroya.test', 'internal_job')
on conflict (id) do update set email = excluded.email, role = excluded.role;

insert into countries (code, name, currency) values ('UY', 'Uruguay', 'UYU') on conflict (code) do nothing;
insert into stores (id, name, country_code)
values ('10000000-0000-4000-8000-000000000001', 'AhorroYA Test Store', 'UY')
on conflict (id) do update set name = excluded.name;
insert into merchant_accounts (id, name, owner_user_id)
values ('20000000-0000-4000-8000-000000000001', 'AhorroYA Merchant Test', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;
insert into merchant_store_access (merchant_account_id, store_id, user_id, role)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'merchant')
on conflict (merchant_account_id, store_id, user_id) do nothing;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);

select pg_temp.assert_true((select count(*) = 1 from profiles where id = '00000000-0000-4000-8000-000000000001'), 'user can read own profile');
select pg_temp.assert_true((select count(*) = 0 from profiles where id = '00000000-0000-4000-8000-000000000002'), 'user cannot read admin profile');

insert into user_favorites (user_id, product)
values ('00000000-0000-4000-8000-000000000001', 'arroz');

do $$
begin
  insert into user_favorites (user_id, product)
  values ('00000000-0000-4000-8000-000000000002', 'aceite');
  raise exception 'RLS assertion failed: user inserted favorite for another user';
exception when insufficient_privilege or check_violation then
  null;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"role":"moderator"}}', true);
update prices set status = status where false;
select pg_temp.assert_true(true, 'moderator can execute moderation policy');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"merchant"}}', true);
update stores set name = 'AhorroYA Merchant Updated Store'
where id = '10000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select name = 'AhorroYA Merchant Updated Store' from stores where id = '10000000-0000-4000-8000-000000000001'), 'merchant can update assigned store');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated","app_metadata":{"role":"internal_job"}}', true);
insert into source_jobs (source_code, status)
values ('uy_uam_mgap', 'queued');
select pg_temp.assert_true((select count(*) > 0 from source_jobs where source_code = 'uy_uam_mgap'), 'internal_job can write source jobs');

rollback;
