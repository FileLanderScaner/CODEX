# Supabase agent migration SQL Editor package

Fecha: 2026-05-03.

## Contexto

- Proyecto staging: `supabase-aquamarine-battery`
- Project ref staging: `wzwjjjajmyfwvspxysjb`
- `current_app_role()` ya existe en staging.
- Las tablas `agent_*` no existen todavia.
- RLS y policies `agent_*` no aplican todavia porque las tablas no existen.
- Supabase CLI no esta disponible en este entorno.
- Ruta aprobada: SQL Editor manual.
- Solo se debe aplicar la migracion de agentes IA.

No ejecutar:

- `supabase-production-schema.sql`
- `supabase-price-schema.sql`
- migraciones base ya aplicadas
- SQL contra production

## Revision de la migracion

Archivo fuente:

```text
supabase/migrations/202605020001_ai_agents_memory.sql
```

### Tablas que crea

- `agent_tasks`
- `agent_logs`
- `agent_reports`
- `agent_suggestions`
- `agent_memory`
- `agent_executions`

### Funcion que crea

- `public.agent_authorized_role()`

No crea otras funciones auxiliares.

### Autorizacion

La funcion usa:

```sql
auth.jwt() -> 'app_metadata' ->> 'role'
```

Roles permitidos:

- `admin`
- `internal_job`

Cualquier otro rol queda como:

- `anon`

Confirmacion de seguridad:

- No usa `user_metadata`.
- No usa `raw_user_meta_data`.
- No usa secretos.
- No baja RLS.

### RLS

La migracion activa RLS en todas las tablas:

- `agent_tasks`
- `agent_logs`
- `agent_reports`
- `agent_suggestions`
- `agent_memory`
- `agent_executions`

### Policies

Crea policies `for all to authenticated` para permitir acceso solo cuando:

```sql
agent_authorized_role() in ('admin','internal_job')
```

Policies creadas:

- `admin_internal_agent_tasks`
- `admin_internal_agent_logs`
- `admin_internal_agent_reports`
- `admin_internal_agent_suggestions`
- `admin_internal_agent_memory`
- `admin_internal_agent_executions`

### Seguridad para staging parcialmente aplicado

Es segura para ejecutar en este proyecto staging porque:

- `agent_*` no existe todavia.
- Las tablas se crean con `create table if not exists`.
- Los indices se crean con `create index if not exists`.
- La funcion se crea con `create or replace function`.
- RLS se activa despues de crear tablas.
- Las policies se crean despues de activar RLS.

Precaucion:

- No reejecutar el archivo completo si las policies ya existen, porque `create policy` no tiene `if not exists` en este SQL.
- Si algo falla, detenerse y guardar el error. No hacer rollback ni modificar RLS sin revision.

## Instrucciones

1. Abrir Supabase Dashboard.
2. Confirmar que el proyecto seleccionado es `supabase-aquamarine-battery`.
3. Confirmar project ref `wzwjjjajmyfwvspxysjb`.
4. Ir a SQL Editor.
5. Crear una nueva query llamada `AhorroYA AI agents memory migration staging`.
6. Pegar y ejecutar el contenido completo de la seccion **SQL a ejecutar**.
7. No ejecutar schemas base.
8. No tocar production.
9. No pegar secretos.
10. Guardar evidencia: timestamp, resultado de ejecucion y capturas sin tokens ni keys.

## SQL a ejecutar

```sql
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

create policy admin_internal_agent_tasks on agent_tasks for all to authenticated using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_logs on agent_logs for all to authenticated using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_reports on agent_reports for all to authenticated using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_suggestions on agent_suggestions for all to authenticated using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_memory on agent_memory for all to authenticated using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
create policy admin_internal_agent_executions on agent_executions for all to authenticated using (agent_authorized_role() in ('admin','internal_job')) with check (agent_authorized_role() in ('admin','internal_job'));
```

## Verificacion post-migracion

Ejecutar estas queries despues de aplicar la migracion.

### Ver tablas agent

```sql
select table_schema, table_name
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
order by table_name;
```

Resultado esperado: 6 filas.

### Ver funcion de autorizacion

```sql
select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'agent_authorized_role';
```

Resultado esperado: 1 fila.

### Ver RLS activo

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'agent_tasks',
    'agent_logs',
    'agent_reports',
    'agent_suggestions',
    'agent_memory',
    'agent_executions'
  )
order by tablename;
```

Resultado esperado: 6 filas con `rowsecurity = true`.

### Ver policies agent

```sql
select schemaname, tablename, policyname, cmd
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
order by tablename, policyname;
```

Resultado esperado: 6 policies `admin_internal_agent_*`.

### Ver columnas criticas

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'agent_tasks',
    'agent_logs',
    'agent_reports',
    'agent_suggestions',
    'agent_memory',
    'agent_executions'
  )
  and column_name in (
    'agent_name',
    'risk',
    'risk_level',
    'permission_level',
    'autonomy_level',
    'environment',
    'dry_run',
    'applied',
    'error_message',
    'created_by',
    'created_at',
    'updated_at',
    'started_at',
    'finished_at'
  )
order by table_name, column_name;
```

Resultado esperado: columnas criticas presentes.

### Confirmar que no hay policies publicas agent

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'agent_%'
  and policyname not like 'admin_internal_agent_%';
```

Resultado esperado: 0 filas.

## Evidencia de Aplicacion

Fecha: 2026-05-03
Supabase project ref: wzwjjjajmyfwvspxysjb
Migración agent IA aplicada: sí
Tablas agent_* creadas: sí
public.agent_authorized_role(): sí
RLS en agent_*: true
Policies admin_internal_agent_*: 6/6
Policies públicas/no esperadas agent_*: 0
Policies usan: `for all to authenticated`
Autorización usa: `auth.jwt() -> 'app_metadata' ->> 'role'`
Roles permitidos: admin, internal_job
No usa user_metadata/raw_user_meta_data
Producción no tocada
Secrets no expuestos

## Verificacion con usuarios reales

Estas pruebas requieren usuarios de staging y JWT refrescado despues de asignar `app_metadata.role`.

### Usuario normal

Requisito:

```json
{
  "role": "user"
}
```

en `app_metadata`.

Prueba desde sesion de usuario normal:

```sql
select count(*) from agent_executions;
```

Resultado esperado:

- 0 filas visibles, o
- permiso denegado segun contexto de ejecucion.

Insert que debe fallar:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'normal_user_should_fail', '{"ok":false}', 'staging');
```

Resultado esperado:

- Bloqueado por RLS.

### Usuario admin

Requisito:

```json
{
  "role": "admin"
}
```

en `app_metadata`.

Insert controlado:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'admin_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Resultado esperado: insert OK.

### Usuario internal_job

Requisito:

```json
{
  "role": "internal_job"
}
```

en `app_metadata`.

Insert controlado:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'internal_job_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Resultado esperado: insert OK.

## Evidencia que Ronald debe guardar

Guardar en `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`:

- Project ref `wzwjjjajmyfwvspxysjb`.
- Timestamp de ejecucion.
- Captura de tablas `agent_*`.
- Captura de RLS activo.
- Captura de policies `admin_internal_agent_*`.
- Resultado de usuario normal bloqueado.
- Resultado de admin permitido.
- Resultado de internal_job permitido.

No guardar:

- `SUPABASE_SERVICE_ROLE_KEY`
- JWT
- refresh token
- password
- connection string
- capturas con secretos visibles

## Estado esperado despues de aplicar

- Supabase agentes: migracion aplicada.
- RLS agentes: activo.
- Usuario normal: bloqueado.
- Admin/internal_job: permitidos.
- Panel IA: sigue apagado hasta aprobacion.
- Agentes IA: siguen apagados hasta aprobacion.
- Level 4: sigue bloqueado.
- Produccion: No-Go.
