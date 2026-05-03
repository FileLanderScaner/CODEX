-- AhorroYA AI agents RLS verification.
-- Run in Supabase staging SQL editor. Do not use production first.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('agent_tasks','agent_logs','agent_reports','agent_suggestions','agent_memory','agent_executions')
order by table_name;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename like 'agent_%'
order by tablename;

select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'agent_authorized_role';

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'agent_%'
order by tablename, policyname;

-- Expected when executed as anon/authenticated without app_metadata.role admin/internal_job:
-- select count(*) from agent_executions;
-- Result should be 0 visible rows or permission denied depending on execution context.

-- Expected with a JWT whose app_metadata.role is admin or internal_job:
-- insert into agent_logs(agent_name, level, event, metadata, environment)
-- values ('RlsSmokeAgent', 'info', 'rls_smoke_test', '{"ok":true}', 'staging')
-- returning id;
