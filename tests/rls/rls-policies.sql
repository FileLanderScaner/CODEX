begin;

create or replace function pg_temp.assert_true(value boolean, message text)
returns void language plpgsql as $$
begin
  if not value then
    raise exception 'RLS assertion failed: %', message;
  end if;
end;
$$;

create or replace function pg_temp.set_test_claims(user_id uuid, app_role text)
returns void language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', user_id::text,
      'role', 'authenticated',
      'app_metadata', jsonb_build_object('role', app_role)
    )::text,
    true
  );
end;
$$;

select pg_temp.assert_true(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ),
  'profiles.id column exists'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ),
  'profiles.role is not part of the staging schema; roles come from app_metadata.role'
);

select pg_temp.assert_true(
  exists (
    select 1
    from information_schema.routines
    where routine_schema = 'public'
      and routine_name = 'agent_authorized_role'
  ),
  'agent_authorized_role helper exists'
);

select pg_temp.assert_true(
  (
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'agent_tasks',
        'agent_logs',
        'agent_reports',
        'agent_suggestions',
        'agent_memory',
        'agent_executions'
      )
  ) = 6,
  'all agent tables exist'
);

select pg_temp.assert_true(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'agent_tasks',
        'agent_logs',
        'agent_reports',
        'agent_suggestions',
        'agent_memory',
        'agent_executions'
      )
      and roles = array['authenticated']::name[]
      and qual like '%agent_authorized_role%'
  ) = 6,
  'agent RLS policies use agent_authorized_role for authenticated users'
);

set local role authenticated;
select pg_temp.set_test_claims('00000000-0000-4000-8000-000000000001', 'user');
select pg_temp.assert_true(public.agent_authorized_role() = 'anon', 'normal user is not agent-authorized');
select pg_temp.assert_true((select count(*) = 0 from public.agent_executions), 'normal user cannot read agent_executions rows');

do $$
begin
  insert into public.agent_logs(agent_name, level, event, metadata, environment)
  values ('RlsSmokeAgent', 'info', 'normal_user_should_fail', '{"ok":false}'::jsonb, 'staging');
  raise exception 'RLS assertion failed: normal user inserted agent_logs';
exception
  when insufficient_privilege or check_violation then
    null;
end $$;

reset role;
set local role authenticated;
select pg_temp.set_test_claims('00000000-0000-4000-8000-000000000002', 'admin');
select pg_temp.assert_true(public.agent_authorized_role() = 'admin', 'admin role is agent-authorized');
insert into public.agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'admin_rls_smoke_test', '{"ok":true}'::jsonb, 'staging');

reset role;
set local role authenticated;
select pg_temp.set_test_claims('00000000-0000-4000-8000-000000000003', 'internal_job');
select pg_temp.assert_true(public.agent_authorized_role() = 'internal_job', 'internal_job role is agent-authorized');
insert into public.agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'internal_job_rls_smoke_test', '{"ok":true}'::jsonb, 'staging');

reset role;

select 'normal_blocked: true' as result;
select 'admin_allowed: true' as result;
select 'internal_job_allowed: true' as result;
select 'rls_validation: PASS' as result;

rollback;
