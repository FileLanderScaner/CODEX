# Staging deploy checklist

## Antes del deploy

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run production:check`

## Vercel

- Configurar public env.
- Configurar server env.
- `ALLOWED_ORIGINS` con dominio staging.
- AI flags seguros.

## Supabase

- Aplicar migraciones en orden.
- Ejecutar `scripts/sql/verify-production-schema.sql`.
- Ejecutar `scripts/sql/verify-ai-agents-rls.sql`.
- Crear usuarios `admin` e `internal_job`.

## PayPal sandbox

- Configurar app sandbox.
- Configurar webhook staging.
- Probar compra.
- Verificar `subscriptions`, `profiles.is_premium`, `premium_until`.

## Google Auth

- Configurar provider en Supabase.
- Agregar redirect staging.
- Probar login/logout.
- Probar migracion favoritos/alertas.

## Smoke tests

- `/api/v1/readiness`
- `/app`
- `/app/buscar?q=leche`
- `/app/premium`
- `/admin/ai-agents`
- `/api/v1/cart/optimize`
- Tracking `app_loaded` y `web_session_started`.

## Criterios para produccion

- Staging sin errores criticos.
- PayPal sandbox aprobado.
- Google Auth aprobado.
- Panel IA bloqueado por defecto en produccion.
- `npm run production:check -- --strict` listo para pasar con env productivas.
