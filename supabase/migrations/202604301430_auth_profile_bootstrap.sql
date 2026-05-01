create schema if not exists private;

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists provider text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.current_app_role() returns text language sql stable as $$
  select case coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
    when 'authenticated' then 'user'
    when 'merchant_admin' then 'merchant'
    else coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
  end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    coalesce(new.raw_app_meta_data ->> 'provider', new.raw_user_meta_data ->> 'provider', 'email')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        provider = coalesce(public.profiles.provider, excluded.provider),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
