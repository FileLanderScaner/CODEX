# Supabase agent RLS user validation

Fecha: 2026-05-03.

## Contexto

La migración de agentes IA fue aplicada correctamente en Supabase staging `supabase-aquamarine-battery` (project ref `wzwjjjajmyfwvspxysjb`). Las tablas `agent_*` existen, RLS está activo, policies `admin_internal_agent_*` usan `for all to authenticated`, y la función `agent_authorized_role()` usa `auth.jwt() -> 'app_metadata' ->> 'role'`.

Ahora se requiere validar que RLS funciona correctamente con usuarios reales, no solo desde SQL Editor con service role.

## Crear usuarios de prueba en Supabase Auth

Crear 3 usuarios en Supabase Dashboard > Authentication > Users:

1. Usuario normal (rol `user`).
2. Usuario admin (rol `admin`).
3. Usuario internal_job (rol `internal_job`).

Usar emails de staging, por ejemplo:
- normal@staging.ahorroya.test
- admin@staging.ahorroya.test
- internal@staging.ahorroya.test

No usar usuarios reales sensibles. No guardar passwords en documentación.

## Asignar roles en Raw app metadata

En Supabase Dashboard, para cada usuario > Edit user > Raw app metadata:

Usuario normal:

```json
{
  "role": "user"
}
```

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

No usar `raw_user_meta_data` ni `user_metadata` para permisos críticos.

Importante: Después de cambiar `app_metadata`, el usuario debe hacer logout/login para refrescar el JWT. El JWT incluye `app_metadata` y se usa en `agent_authorized_role()`.

No guardar JWT, refresh tokens, passwords ni service role key.

## Validar RLS con usuarios reales

Las pruebas deben ejecutarse desde una sesión autenticada real (cliente web/app con JWT), no desde SQL Editor.

### Método recomendado

- Opción A (recomendada): usar la app o cliente staging con anon key y login real de cada usuario.
- Opción B: si se prefiere, usar un script local temporal no commiteado para login con email/password de staging y pruebas select/insert. El script no debe guardarse en el repositorio ni imprimir JWT ni passwords.

Ver `docs/SUPABASE_AGENT_RLS_USER_VALIDATION_RUNBOOK.md` para el runbook operativo completo.

### Usuario normal debe fallar

Con sesión de usuario normal (rol `user`):

```sql
select count(*) from agent_executions;
```

Resultado esperado: 0 filas visibles, o permiso denegado.

Insert que debe fallar:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'normal_user_should_fail', '{"ok":false}', 'staging');
```

Resultado esperado: Bloqueado por RLS (error de permiso).

### Usuario admin debe insertar OK

Con sesión de usuario admin (rol `admin`):

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'admin_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Resultado esperado: Insert OK, devuelve fila con id, etc.

### Usuario internal_job debe insertar OK

Con sesión de usuario internal_job (rol `internal_job`):

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'internal_job_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Resultado esperado: Insert OK, devuelve fila con id, etc.

## Formato de evidencia

Guardar en `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`:

- User id parcial (ej: `abc123...` sin full id).
- Rol esperado (user/admin/internal_job).
- Resultado normal bloqueado: sí/no.
- Resultado admin permitido: sí/no.
- Resultado internal_job permitido: sí/no.
- Sin JWT ni passwords.

Ejemplo:

- Usuario normal (user): bloqueado en select/insert.
- Usuario admin (admin): permitido insert en agent_logs.
- Usuario internal_job (internal_job): permitido insert en agent_logs.

## Proximo paso

Después de validar RLS con usuarios reales, staging puede avanzar a PayPal sandbox y Google Auth.