create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free',
  paypal_order_id text,
  premium_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  amount numeric(12, 2) not null,
  category text not null default 'General',
  happened_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null default 0,
  current_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;

create policy "profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "transactions are readable by owner"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions are insertable by owner"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions are updatable by owner"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions are deletable by owner"
  on public.transactions for delete
  using (auth.uid() = user_id);

create policy "goals are readable by owner"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals are insertable by owner"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals are updatable by owner"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals are deletable by owner"
  on public.goals for delete
  using (auth.uid() = user_id);
