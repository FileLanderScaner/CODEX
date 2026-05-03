# Supabase staging execution checklist

| Paso | Accion | Evidencia | Estado |
|---|---|---|---|
| 1 | Crear o seleccionar proyecto Supabase staging | Project ref y URL | Pendiente |
| 2 | Confirmar `EXPO_PUBLIC_SUPABASE_URL` y `SUPABASE_URL` | URL del proyecto | Pendiente |
| 3 | Confirmar `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key | Pendiente |
| 4 | Confirmar `SUPABASE_SERVICE_ROLE_KEY` solo para backend | Captura Vercel server env, sin mostrar valor | Pendiente |
| 5 | Aplicar `supabase-production-schema.sql` | SQL ejecutado sin error | Pendiente |
| 6 | Aplicar `supabase-price-schema.sql` | SQL ejecutado sin error | Pendiente |
| 7 | Aplicar `supabase/migrations/202605010001_unicorn_growth_monetization.sql` | SQL ejecutado sin error | Pendiente |
| 8 | Aplicar `supabase/migrations/202605020001_ai_agents_memory.sql` | SQL ejecutado sin error | Pendiente |
| 9 | Ejecutar `scripts/sql/verify-production-schema.sql` | Resultado con tablas esperadas | Pendiente |
| 10 | Ejecutar `scripts/sql/verify-ai-agents-rls.sql` | RLS activo y policies presentes | Pendiente |
| 11 | Crear usuario normal | Email/id staging | Pendiente |
| 12 | Crear usuario admin | Email/id staging | Pendiente |
| 13 | Crear usuario internal_job | Email/id staging | Pendiente |
| 14 | Setear `app_metadata.role="admin"` al admin | Captura metadata sin tokens | Pendiente |
| 15 | Setear `app_metadata.role="internal_job"` al job | Captura metadata sin tokens | Pendiente |
| 16 | Validar usuario normal sin acceso a tablas de agentes | Sin filas visibles o permiso denegado | Pendiente |
| 17 | Validar admin con acceso a tablas de agentes | Select/insert controlado OK | Pendiente |
| 18 | Validar internal_job con acceso a tablas de agentes | Select/insert controlado OK | Pendiente |
| 19 | Confirmar RLS activo en tablas `agent_*` | `rowsecurity=true` | Pendiente |
| 20 | Confirmar permisos criticos usan `app_metadata`, no `user_metadata` | Revision policies/function | Pendiente |

## Orden de migraciones

1. `supabase-production-schema.sql`
2. `supabase-price-schema.sql`
3. `supabase/migrations/202605010001_unicorn_growth_monetization.sql`
4. `supabase/migrations/202605020001_ai_agents_memory.sql`

## Validacion RLS esperada

- Usuario normal: no accede a `agent_tasks`, `agent_logs`, `agent_reports`, `agent_suggestions`, `agent_memory`, `agent_executions`.
- Admin: puede leer/escribir segun policies.
- Internal job: puede leer/escribir segun policies.
- Nunca usar `user_metadata` para permisos criticos.

## Rollback si falla

En staging, y solo despues de guardar evidencia:

```sql
drop table if exists agent_logs cascade;
drop table if exists agent_reports cascade;
drop table if exists agent_suggestions cascade;
drop table if exists agent_memory cascade;
drop table if exists agent_tasks cascade;
drop table if exists agent_executions cascade;
drop function if exists public.agent_authorized_role();
```

Si falla una migracion base, restaurar backup staging o recrear proyecto staging. No aplicar rollback destructivo en produccion.

## Evidencia que guardar

- Project ref staging.
- Timestamp de migraciones.
- Resultado de scripts SQL.
- Capturas de RLS activo.
- IDs de usuarios de prueba sin exponer tokens.
- Resultado de acceso normal/admin/internal_job.
