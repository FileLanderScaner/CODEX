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
