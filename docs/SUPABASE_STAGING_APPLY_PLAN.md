# Supabase staging apply plan

Fecha: 2026-05-03.

## Estado detectado

- Supabase CLI no esta disponible en este entorno (`supabase` no reconocido).
- No se puede automatizar `supabase link`, `db push` ni migraciones desde esta maquina.
- Ruta recomendada actual: Supabase Dashboard / SQL Editor en un proyecto staging confirmado por Ronald.
- Migración agent IA aplicada: sí (2026-05-03, project ref wzwjjjajmyfwvspxysjb).
- No se aplicaron otras migraciones.
- No se tocaron production, variables remotas ni secretos.

## Proyecto staging requerido

Ronald debe crear o seleccionar un proyecto Supabase exclusivo de staging.

Antes de ejecutar SQL, confirmar y guardar como evidencia sin secretos:

- Project name.
- Project ref.
- Region.
- URL del proyecto.
- Fecha/hora de aplicacion.
- Usuario responsable.

No usar project ref de production.

## Variables que Ronald debe obtener

No pegar valores en archivos versionados ni en ChatGPT.

| Variable | Uso | Donde cargar | Exponer frontend |
|---|---|---|---|
| `SUPABASE_URL` | Backend/serverless | Vercel server env | No |
| `EXPO_PUBLIC_SUPABASE_URL` | Cliente web/app | Vercel public env | Si |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Cliente web/app | Vercel public env | Si |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend server-only | Vercel server env | No |

Reglas:

- `SUPABASE_SERVICE_ROLE_KEY` solo servidor.
- No crear `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- No pegar service role key en docs, issues, logs o capturas visibles.

## Hallazgos de migraciones

### Migraciones base revisadas

- `supabase-production-schema.sql`
- `supabase-price-schema.sql`
- `supabase/migrations/202605010001_unicorn_growth_monetization.sql`
- `supabase/migrations/202605020001_ai_agents_memory.sql`

### Riesgo detectado

`supabase/migrations/202605010001_unicorn_growth_monetization.sql` usa `current_app_role()` en sus policies.

Esa funcion no se crea en `supabase-production-schema.sql` ni en `supabase-price-schema.sql`.

La funcion si existe en migraciones previas:

- `supabase/migrations/202604301430_auth_profile_bootstrap.sql`
- `supabase/migrations/202604270003_roles_rls_hardening.sql`

La version segura lee `auth.jwt() -> 'app_metadata' ->> 'role'` y no usa `user_metadata` para permisos criticos.

## Estado operativo actual del staging

Este plan queda actualizado para el proyecto Supabase staging real:

- Project name: `supabase-aquamarine-battery`.
- Project ref: `wzwjjjajmyfwvspxysjb`.
- Este proyecto no es un staging limpio: ya tenia tablas base antes de la migracion de agentes IA.
- No reejecutar `supabase-production-schema.sql` en `wzwjjjajmyfwvspxysjb`.
- No reejecutar `supabase-price-schema.sql` en `wzwjjjajmyfwvspxysjb`.
- La migracion agent IA `supabase/migrations/202605020001_ai_agents_memory.sql` ya fue aplicada correctamente.
- Supabase schema agentes: Go.
- Supabase RLS estructura: Go.
- Supabase RLS usuarios reales: pendiente.

Siguiente accion para este staging: ejecutar el smoke RLS real con `scripts/rls-agent-user-smoke.mjs` usando un `.env.rls` local ignorado por git. No migrar de nuevo.

## Preflight obligatorio

Antes de ejecutar la migracion growth/monetizacion, correr:

```sql
select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'current_app_role';
```

Resultado esperado:

```text
public | current_app_role
```

Si no existe, aplicar este helper seguro antes de `202605010001_unicorn_growth_monetization.sql`:

```sql
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select case coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
    when 'authenticated' then 'user'
    when 'merchant_admin' then 'merchant'
    else coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
  end;
$$;
```

No usar `user_metadata` para esta funcion.

## Orden exacto recomendado

### Ruta A: staging limpio con SQL Editor

Solo para proyectos nuevos/limpios. No aplica al staging actual `wzwjjjajmyfwvspxysjb`.

No usar esta ruta contra `supabase-aquamarine-battery`, porque ese proyecto ya tenia tablas base y la migracion agent IA ya fue aplicada correctamente.

1. Confirmar que el proyecto es staging.
2. Ejecutar `supabase-production-schema.sql`.
3. Ejecutar `supabase-price-schema.sql`.
4. Ejecutar preflight de `current_app_role()`.
5. Si falta `current_app_role()`, ejecutar el helper seguro de este plan.
6. Ejecutar `supabase/migrations/202605010001_unicorn_growth_monetization.sql`.
7. Ejecutar `supabase/migrations/202605020001_ai_agents_memory.sql`.
8. Ejecutar `scripts/sql/verify-production-schema.sql`.
9. Ejecutar `scripts/sql/verify-ai-agents-rls.sql`.

### Ruta B: si Ronald decide usar historial completo de migraciones

Aplicar las migraciones de `supabase/migrations/` en orden cronologico contra staging, nunca contra production primero.

Validar especialmente que:

- `current_app_role()` queda basado en `app_metadata`.
- `agent_authorized_role()` queda basado en `app_metadata`.
- RLS queda activo en tablas publicas y `agent_*`.

## SQL de verificacion

Ejecutar:

```sql
-- scripts/sql/verify-production-schema.sql
-- scripts/sql/verify-ai-agents-rls.sql
```

Checks esperados:

- Tablas base presentes.
- Tablas `agent_tasks`, `agent_logs`, `agent_reports`, `agent_suggestions`, `agent_memory`, `agent_executions` presentes.
- `rowsecurity=true` en tablas `agent_*`.
- Funcion `public.agent_authorized_role()` presente.
- Funcion `public.current_app_role()` presente si se aplica growth/monetizacion.
- Policies `admin_internal_agent_*` presentes.

## Crear usuarios de prueba

Crear en Supabase Auth:

1. Usuario normal.
2. Usuario admin.
3. Usuario internal_job.

Usar emails de staging, no usuarios reales sensibles.

Guardar evidencia:

- Email parcial o alias de staging.
- User id.
- Rol esperado.
- No guardar access tokens ni refresh tokens.

## Asignar roles con app_metadata

En Supabase Dashboard, Auth > Users > usuario > Edit user > Raw app metadata.

Usuario admin:

```json
{
  "role": "admin"
}
```

Usuario internal_job:

```json
{
  "role": "internal_job"
}
```

Usuario normal:

```json
{
  "role": "user"
}
```

No usar `raw_user_meta_data` / `user_metadata` para permisos criticos.

Importante: despues de cambiar `app_metadata`, refrescar sesion del usuario o hacer logout/login para emitir un JWT nuevo.

## Validar usuario normal sin acceso a agent_*

Desde una sesion autenticada normal o cliente con JWT normal:

```sql
select count(*) from agent_executions;
```

Resultado esperado:

- 0 filas visibles, o
- permiso denegado, segun contexto de ejecucion.

Tambien probar insert controlado:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'normal_user_should_fail', '{"ok":false}', 'staging');
```

Resultado esperado:

- insert bloqueado por RLS.

## Validar admin/internal_job con acceso

Con JWT refrescado de usuario admin:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'admin_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Con JWT refrescado de usuario internal_job:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'internal_job_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Resultado esperado:

- insert OK.
- select de logs recientes OK.

## Evidencia sin secretos

Guardar en `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`:

- Project ref staging.
- Timestamp de cada migracion.
- Captura o salida de tablas presentes.
- Captura o salida de `rowsecurity=true`.
- Lista de policy names, sin tokens.
- User ids de prueba.
- Resultado normal bloqueado.
- Resultado admin/internal_job permitido.

No guardar:

- `SUPABASE_SERVICE_ROLE_KEY`.
- JWT.
- refresh token.
- passwords.
- connection string con password.

## Rollback seguro

Solo staging y solo si no hay datos utiles.

Rollback de agentes:

```sql
drop table if exists agent_logs cascade;
drop table if exists agent_reports cascade;
drop table if exists agent_suggestions cascade;
drop table if exists agent_memory cascade;
drop table if exists agent_tasks cascade;
drop table if exists agent_executions cascade;
drop function if exists public.agent_authorized_role();
```

Si falla el esquema base:

1. Detenerse.
2. Guardar error exacto.
3. No intentar "arreglar" bajando RLS.
4. Rehacer proyecto staging o restaurar backup staging.

Nunca ejecutar rollback destructivo en production sin plan aprobado.

## Estado Go/No-Go

- Supabase schema agentes: Go
- Supabase RLS estructura: Go
- Supabase RLS usuarios reales: pendiente
- Staging general: No-Go
- Produccion: No-Go

## Proximo paso seguro

Ronald debe confirmar:

1. Project ref de Supabase staging.
2. Si aplicara SQL por Dashboard o instalara Supabase CLI.
3. Que `current_app_role()` existe o que se aplicara el helper seguro antes de growth/monetizacion.

Despues de esa confirmacion, ejecutar migraciones en staging y completar evidencia.
