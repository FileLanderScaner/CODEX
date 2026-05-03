# Supabase staging runbook

## Orden de migraciones

Aplicar primero en un proyecto Supabase staging vacio o restaurado desde backup sanitizado:

1. `supabase-production-schema.sql`
2. `supabase-price-schema.sql`
3. `supabase/migrations/202605010001_unicorn_growth_monetization.sql`
4. `supabase/migrations/202605020001_ai_agents_memory.sql`

## Supabase CLI

```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

Si no se usa CLI, ejecutar cada archivo en SQL Editor respetando el orden anterior.

## Verificacion

Ejecutar:

```sql
-- scripts/sql/verify-production-schema.sql
-- scripts/sql/verify-ai-agents-rls.sql
```

## Usuarios de prueba

Crear o actualizar usuarios de staging:

- Usuario admin: `app_metadata.role = "admin"`
- Usuario job: `app_metadata.role = "internal_job"`
- Usuario normal: sin rol o `authenticated`

Nunca usar `user_metadata` para autorizacion.

## Smoke queries

Como admin/internal_job:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('StagingSmokeAgent', 'info', 'staging_smoke', '{"ok":true}', 'staging')
returning id;
```

Como usuario normal:

```sql
select * from agent_logs limit 1;
-- esperado: sin filas visibles o permiso denegado.
```

## Rollback

En staging:

```sql
drop table if exists agent_logs cascade;
drop table if exists agent_reports cascade;
drop table if exists agent_suggestions cascade;
drop table if exists agent_memory cascade;
drop table if exists agent_tasks cascade;
drop table if exists agent_executions cascade;
drop function if exists public.agent_authorized_role();
```

En produccion no hacer rollback destructivo sin backup. Primero apagar:

```env
ENABLE_ADMIN_AI_PANEL=false
ENABLE_AI_AGENTS=false
AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY
ENABLE_AI_LEVEL4_OVERRIDE=false
```
