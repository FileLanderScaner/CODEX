# Supabase agent RLS user validation runbook

Fecha: 2026-05-03.

## Objetivo

Guiar a Ronald para validar RLS real de tablas `agent_*` en Supabase staging sin exponer secretos y sin tocar producción.

## Entorno

- Proyecto Supabase staging: `supabase-aquamarine-battery`
- Project ref: `wzwjjjajmyfwvspxysjb`
- Migración agent IA aplicada: sí
- Tablas `agent_*` creadas: sí
- `public.agent_authorized_role()`: existe
- RLS en `agent_*`: activo
- Policies `admin_internal_agent_*`: 6/6
- Policies usan: `for all to authenticated`
- Autorización usa: `auth.jwt() -> 'app_metadata' ->> 'role'`
- Roles permitidos: `admin`, `internal_job`

## Reglas de validación

- No usar `user_metadata`.
- No pedir ni guardar passwords.
- No pedir ni guardar JWT.
- No pedir ni guardar service role key.
- No activar panel IA.
- No activar agentes IA.
- No activar Level 4.
- No modificar SQL remoto.
- No tocar producción.
- No exponer secretos en capturas o reportes.

## Paso 1: crear usuarios de prueba

En Supabase Dashboard > Authentication > Users:

1. Crear usuario `normal@staging.ahorroya.test`.
2. Crear usuario `admin@staging.ahorroya.test`.
3. Crear usuario `internal@staging.ahorroya.test`.

Usar correos de staging de bajo riesgo y no usuarios reales sensibles.

## Paso 2: asignar roles en Raw app metadata

Para cada usuario, editar Raw app metadata en Supabase Dashboard:

- Usuario normal:

```json
{
  "role": "user"
}
```

- Usuario admin:

```json
{
  "role": "admin"
}
```

- Usuario internal_job:

```json
{
  "role": "internal_job"
}
```

No usar `raw_user_meta_data` ni `user_metadata` para permisos críticos.

## Paso 3: refrescar sesión

Después de cambiar `app_metadata`, cada usuario debe cerrar sesión y volver a iniciar sesión para emitir un JWT actualizado que contenga el nuevo rol.

## Método recomendado

### Opción A: usar la app/cliente con anon key y login real

Recomendado como primera opción.

1. Abrir la app web o cliente staging donde se use la anon key de Supabase.
2. Iniciar sesión con el usuario normal.
3. Ejecutar las operaciones de validación contra `agent_logs` y `agent_executions`.
4. Repetir para los usuarios `admin` y `internal_job`.

Esta opción usa la experiencia real de usuario y evita scripts temporales.

### Opción B: usar un script local temporal sin commitear

Si se requiere un control más directo, usar un script local temporal que:

- use la anon key de staging
- inicie sesión con email/password de cada usuario
- ejecute select/insert contra `agent_logs`
- no imprima JWT ni passwords
- no sea commiteado bajo ningún concepto

Ejemplo de plantilla (no guardar credenciales):

```js
// Ejemplo local temporal: no commitear
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://<supabase-project>.supabase.co';
const SUPABASE_ANON_KEY = '<anon-key-de-staging>'; // solo en entorno local

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function executeSql(jwt, sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return res.json();
}

// Uso local:
// 1. crear un archivo .env local con las credenciales temporales.
// 2. ejecutar el script localmente.
// 3. eliminar el archivo y no commitear nada.
```

> Nota: esta plantilla es solo un ejemplo. No debe incluir ningún JWT, password o service role key en el repositorio.

## Script de validación recomendado

Usar el script local seguro `scripts/rls-agent-user-smoke.mjs` y el archivo de plantilla `.env.rls.example`.

1. Copiar:

```sh
cp .env.rls.example .env.rls
```

2. Completar `.env.rls` localmente con:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `RLS_NORMAL_EMAIL`
   - `RLS_NORMAL_PASSWORD`
   - `RLS_ADMIN_EMAIL`
   - `RLS_ADMIN_PASSWORD`
   - `RLS_INTERNAL_EMAIL`
   - `RLS_INTERNAL_PASSWORD`

3. Ejecutar:

```sh
node scripts/rls-agent-user-smoke.mjs
```

4. Reportar solo:
   - `normal_blocked`
   - `admin_allowed`
   - `internal_job_allowed`
   - `rls_validation`

5. No commitear `.env.rls`.

## Resultados esperados

### Usuario normal

- `select count(*) from agent_executions;`
  - Resultado esperado: 0 filas visibles o permiso denegado.
- `insert into agent_logs(...)` debe ser bloqueado por RLS.

### Usuario admin

- `insert into agent_logs(...)` debe ser permitido.

### Usuario internal_job

- `insert into agent_logs(...)` debe ser permitido.

## SQL de validación esperado

Estas instrucciones se aplican solo desde una sesión autenticada real con JWT vigente.

Usuario normal:

```sql
select count(*) from agent_executions;
```

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'normal_user_should_fail', '{"ok":false}', 'staging');
```

Usuario admin:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'admin_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

Usuario internal_job:

```sql
insert into agent_logs(agent_name, level, event, metadata, environment)
values ('RlsSmokeAgent', 'info', 'internal_job_rls_smoke_test', '{"ok":true}', 'staging')
returning id, agent_name, level, event, environment, created_at;
```

## Evidencia que guardar

Guardar solo lo siguiente en reportes:

- email parcial o alias del usuario de staging.
- user id parcial (por ejemplo `abc123...`).
- rol esperado (`user`, `admin`, `internal_job`).
- resultado permitido/bloqueado.
- timestamp de la prueba.
- nota de que no se guardaron JWT, refresh token, password ni service role key.

No guardar:

- JWT
- refresh token
- password
- service role key
- connection strings con credenciales

## Estado Go/No-Go para esta validación

- Supabase schema agentes: Go
- Supabase RLS estructura: Go
- Supabase RLS usuarios reales: pendiente
- Staging: No-Go
- Producción: No-Go

## Próximo paso manual

Ronald debe ejecutar esta validación en staging y documentar los resultados en `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`.
