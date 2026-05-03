-- AhorroYA production/staging schema smoke verification.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'prices',
    'subscriptions',
    'user_savings',
    'price_observations',
    'agent_executions',
    'agent_suggestions'
  )
order by table_name;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','prices','subscriptions','user_savings','agent_executions','agent_suggestions')
order by tablename;

select routine_schema, routine_name
from information_schema.routines
where routine_schema in ('public','private')
  and routine_name in ('current_app_role','agent_authorized_role','get_user_monthly_savings','is_user_premium')
order by routine_schema, routine_name;

select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','prices','subscriptions','user_savings','agent_executions','agent_suggestions')
order by tablename, policyname;
