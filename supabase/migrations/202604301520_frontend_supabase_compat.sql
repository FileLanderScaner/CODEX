alter table public.user_favorites add column if not exists product text;
alter table public.user_favorites add column if not exists price_id uuid;
update public.user_favorites
set product = normalized_product
where product is null;

alter table public.price_alerts add column if not exists product text;
alter table public.price_alerts add column if not exists currency text not null default 'UYU';
update public.price_alerts
set product = normalized_product
where product is null;

alter table public.product_links add column if not exists product text;
update public.product_links
set product = normalized_product
where product is null;
create index if not exists product_links_product_active_idx
  on public.product_links(product, active);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  amount numeric(14,2) not null,
  category text not null default 'General',
  happened_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null default 0,
  current_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.goals enable row level security;

create index if not exists transactions_user_happened_idx
  on public.transactions(user_id, happened_at desc);
create index if not exists goals_user_created_idx
  on public.goals(user_id, created_at);

drop policy if exists "users manage own transactions" on public.transactions;
create policy "users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own goals" on public.goals;
create policy "users manage own goals" on public.goals
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
