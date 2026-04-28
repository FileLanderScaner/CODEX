# Roles and RLS

Roles soportados:

- `anon`: lectura publica limitada.
- `authenticated`: favoritos, alertas, reportes y contribuciones propias.
- `moderator`: revision de precios y reportes.
- `admin`: acceso operativo completo.
- `merchant_admin`: acceso a cuentas y tiendas asignadas.
- `internal_job`: ingesta y jobs.

Los roles deben viajar en `auth.jwt().app_metadata.role`. Las policies viven en `supabase/migrations/202604270001_production_schema.sql`.
