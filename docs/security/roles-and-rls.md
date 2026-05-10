# Roles and RLS

Roles soportados en produccion:

- `anon`: lectura publica limitada.
- `user`: favoritos, alertas, reportes y contribuciones propias.
- `moderator`: revision de precios y reportes.
- `admin`: acceso operativo completo.
- `merchant`: acceso a cuentas y tiendas asignadas.
- `internal_job`: ingesta y jobs.

Los roles deben viajar en `auth.jwt().app_metadata.role`. Las policies viven en `supabase/migrations/202604270001_production_schema.sql` y se endurecen en `supabase/migrations/202604270003_roles_rls_hardening.sql`.

Compatibilidad:

- `authenticated` se normaliza a `user`.
- `merchant_admin` se normaliza a `merchant`.

Validacion automatica:

- Seeds: `supabase/seed.sql` crea usuarios de prueba para `user`, `admin`, `moderator`, `merchant` e `internal_job`.
- Tests: `npm run test:rls` ejecuta `tests/rls/rls-policies.sql` contra `SUPABASE_DB_URL`.
- Para reset local antes de probar: `RESET_SUPABASE_DB=true npm run test:rls`.

Conexion staging recomendada:

- Usar `SUPABASE_DB_URL` con Session Pooler de Supabase cuando la red local no soporte IPv6 para el host directo `db.<PROJECT_REF>.supabase.co:5432`.
- Obtener la URL desde Supabase Dashboard > Connect > Session pooler.
- Formato esperado: `postgresql://postgres.<PROJECT_REF>:<URL_ENCODED_PASSWORD>@<POOLER_HOST>:5432/postgres?sslmode=require`.
- Mantener `ENVIRONMENT=staging` y `SUPABASE_STAGING_PROJECT_REF=<PROJECT_REF>` en `.env.rls`.
- No commitear `.env.rls` ni imprimir la URL. URL-encodear caracteres especiales de la password.

Auth production gate:

- Antes de production, revisar manualmente Supabase Auth leaked password protection en Dashboard.
- No asumir que esta activado sin evidencia.
- Si no hay evidencia o el plan no lo permite, production queda `NO-GO_PRODUCTION`.
- Runbook: `docs/security/supabase-auth-production-gate.md`.
