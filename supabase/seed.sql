insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000001', 'user@ahorroya.test', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"user"}', '{}'),
  ('00000000-0000-4000-8000-000000000002', 'admin@ahorroya.test', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"admin"}', '{}'),
  ('00000000-0000-4000-8000-000000000003', 'moderator@ahorroya.test', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"moderator"}', '{}'),
  ('00000000-0000-4000-8000-000000000004', 'merchant@ahorroya.test', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"merchant"}', '{}'),
  ('00000000-0000-4000-8000-000000000005', 'job@ahorroya.test', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"internal_job"}', '{}')
on conflict (id) do nothing;

insert into profiles (id, email, role)
values
  ('00000000-0000-4000-8000-000000000001', 'user@ahorroya.test', 'user'),
  ('00000000-0000-4000-8000-000000000002', 'admin@ahorroya.test', 'admin'),
  ('00000000-0000-4000-8000-000000000003', 'moderator@ahorroya.test', 'moderator'),
  ('00000000-0000-4000-8000-000000000004', 'merchant@ahorroya.test', 'merchant'),
  ('00000000-0000-4000-8000-000000000005', 'job@ahorroya.test', 'internal_job')
on conflict (id) do update set email = excluded.email, role = excluded.role;

insert into countries (code, name, currency)
values ('UY', 'Uruguay', 'UYU'), ('CL', 'Chile', 'CLP'), ('CO', 'Colombia', 'COP'), ('MX', 'Mexico', 'MXN')
on conflict (code) do nothing;

insert into stores (id, name, country_code)
values ('10000000-0000-4000-8000-000000000001', 'AhorroYA Test Store', 'UY')
on conflict (id) do nothing;

insert into merchant_accounts (id, name, owner_user_id)
values ('20000000-0000-4000-8000-000000000001', 'AhorroYA Merchant Test', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into merchant_store_access (merchant_account_id, store_id, user_id, role)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'merchant')
on conflict (merchant_account_id, store_id, user_id) do nothing;
