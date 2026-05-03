create or replace function public.agent_authorized_role()
returns text
language sql
stable
as $$
  select case coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'anon')
    when 'admin' then 'admin'
    when 'internal_job' then 'internal_job'
    else 'anon'
  end;
$$;

create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  task_type text not null default 'suggestion',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','blocked','rejected','approved','applied')),
  risk text not null default 'low' check (risk in ('low','medium','high','critical')),
  risk_level text generated always as (risk) stored,
  permission_level text not null default 'LEVEL_0_READ_ONLY',
  environment text not null default 'local',
  dry_run boolean not null default true,
  applied boolean not null default false,
  error_message text,
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid,
  agent_name text not null,
  level text not null default 'info' check (level in ('info','warn','error','security','blocked_action')),
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  environment text not null default 'local',
  created_at timestamptz not null default now()
);

create table if not exists agent_reports (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid,
  agent_name text not null,
  report_type text not null,
  content jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  severity text not null default 'info' check (severity in ('info','low','medium','high','critical')),
  recommendations jsonb not null default '[]'::jsonb,
  risk text not null default 'low' check (risk in ('low','medium','high','critical')),
  risk_level text generated always as (risk) stored,
  environment text not null default 'local',
  created_at timestamptz not null default now()
);

create table if not exists agent_suggestions (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  title text not null,
  description text,
  impact text not null default 'medium' check (impact in ('low','medium','high')),
  effort text not null default 'medium' check (effort in ('low','medium','high')),
  risk text not null default 'low' check (risk in ('low','medium','high','critical')),
  risk_level text generated always as (risk) stored,
  status text not null default 'pending' check (status in ('pending','proposed','approved','rejected','applied','failed','blocked')),
  payload jsonb not null default '{}'::jsonb,
  environment text not null default 'local',
  applied boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','sensitive')),
  environment text not null default 'local',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(namespace, key, environment)
);

create table if not exists agent_executions (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('completed','failed','blocked')),
  risk text not null default 'low' check (risk in ('low','medium','high','critical')),
  risk_level text generated always as (risk) stored,
  permission_level text not null default 'LEVEL_0_READ_ONLY',
  autonomy_level text not null default 'LEVEL_0_READ_ONLY',
  environment text not null default 'local',
  dry_run boolean not null default true,
  applied boolean not null default false,
  app_version text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_agent_tasks_status on agent_tasks(status, created_at desc);
create index if not exists idx_agent_logs_execution on agent_logs(execution_id, created_at desc);
create index if not exists idx_agent_reports_agent on agent_reports(agent_name, created_at desc);
create index if not exists idx_agent_suggestions_status on agent_suggestions(status, impact, risk);
create index if not exists idx_agent_executions_agent on agent_executions(agent_name, started_at desc);
create index if not exists idx_agent_executions_env on agent_executions(environment, status, started_at desc);
create index if not exists idx_agent_logs_env on agent_logs(environment, created_at desc);

alter table agent_tasks enable row level security;
alter table agent_logs enable row level security;
alter table agent_reports enable row level security;
alter table agent_suggestions enable row level security;
alter table agent_memory enable row level security;
alter table agent_executions enable row level security;

create policy admin_internal_agent_tasks on agent_tasks for all using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_logs on agent_logs for all using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_reports on agent_reports for all using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_suggestions on agent_suggestions for all using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_memory on agent_memory for all using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_executions on agent_executions for all using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
