# Supabase AI Agents setup

## Objetivo

Persistir ejecuciones, logs, reportes, sugerencias, memoria y tareas de agentes IA sin exponer credenciales al frontend.

## Migracion

Archivo:

```text
supabase/migrations/202605020001_ai_agents_memory.sql
```

Tablas creadas:

- `agent_tasks`
- `agent_logs`
- `agent_reports`
- `agent_suggestions`
- `agent_memory`
- `agent_executions`

Funcion auxiliar:

```sql
public.agent_authorized_role()
```

Lee exclusivamente `auth.jwt() -> 'app_metadata' ->> 'role'` y solo reconoce:

- `admin`
- `internal_job`

Cualquier otro rol queda como `anon`.

## Aplicar en staging

Desde Supabase CLI o SQL Editor:

```sql
-- ejecutar el contenido de supabase/migrations/202605020001_ai_agents_memory.sql
```

No aplicar primero en produccion. Validar en staging con usuarios reales de rol `admin` e `internal_job`.

## Variables necesarias

Servidor:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
ENABLE_ADMIN_AI_PANEL=true
ENABLE_AI_AGENTS=true
AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY
ENABLE_AI_LEVEL4_OVERRIDE=false
```

Frontend:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=
```

## Verificar tablas

```sql
select table_name
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

## Verificar RLS

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename like 'agent_%'
order by tablename;
```

## Verificar policies

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'agent_%'
order by tablename, policyname;
```

## Pruebas esperadas

Como anon/authenticated sin `app_metadata.role` autorizado:

```sql
select * from agent_executions limit 1;
-- esperado: 0 filas visibles o error de permisos segun contexto de ejecucion
```

Como usuario con `app_metadata.role = admin`:

```sql
insert into agent_executions (
  agent_name,
  input_summary,
  output_summary,
  status,
  risk,
  permission_level,
  autonomy_level,
  environment,
  dry_run
) values (
  'ProductAuditAgent',
  '{"source":"rls_test"}',
  '{"ok":true}',
  'completed',
  'low',
  'LEVEL_0_READ_ONLY',
  'LEVEL_0_READ_ONLY',
  'staging',
  true
) returning id;
```

## Rollback recomendado

Solo en staging o si todavia no hay datos utiles:

```sql
drop table if exists agent_logs cascade;
drop table if exists agent_reports cascade;
drop table if exists agent_suggestions cascade;
drop table if exists agent_memory cascade;
drop table if exists agent_tasks cascade;
drop table if exists agent_executions cascade;
drop function if exists public.agent_authorized_role();
```

En produccion, preferir pausar el panel:

```env
ENABLE_ADMIN_AI_PANEL=false
ENABLE_AI_AGENTS=false
AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY
```

## Notas de seguridad

- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en serverless backend.
- El panel admin llama `/api/v1/ai/agents` con token de usuario.
- La API valida rol con Supabase Auth antes de crear el orquestador.
- La persistencia cae a memoria local si falta Supabase, sin romper la app.
- La memoria sanitiza claves con nombres como `secret`, `token`, `key`, `password` o `credential` antes de persistir payloads resumidos.
