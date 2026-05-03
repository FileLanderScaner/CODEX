# Staging release candidate report

Completar despues del deploy staging.

## Identificacion

- Branch:
- Commit:
- Fecha:
- Responsable:
- URL staging:
- Supabase project ref:
- Vercel deployment id/url:

## Validaciones automaticas

- `npm run lint`:
- `npm run typecheck`:
- `npm test`:
- `npm run build`:
- `npm run production:check`:
- `npm run staging:check`:
- `npm run test:e2e`:

## Resultado `production:check`

```text
mode=
supabase_public=
supabase_server=
paypal=
google_auth=
allowed_origins=
ai_safe_defaults=
missing_public=
missing_staging=
dangerously_exposed=
risks=
```

## Smoke tests

- Resultado general:
- Pruebas fallidas:
- Evidencia:

## PayPal sandbox

- Compra mensual:
- Compra anual:
- Webhook:
- `premium_until`:
- Cancelacion/fallo:
- Incidentes:

## Google Auth

- Login:
- Logout:
- Favoritos migrados:
- Alertas migradas:
- Usuario sin rol:
- Usuario admin:
- Incidentes:

## Supabase RLS

- `scripts/sql/verify-production-schema.sql`:
- `scripts/sql/verify-ai-agents-rls.sql`:
- Usuario normal bloqueado:
- Admin permitido:
- Internal job permitido:
- RLS activo:
- Incidentes:

## Panel IA

- Bloqueado con `ENABLE_ADMIN_AI_PANEL=false`:
- Admin dry-run:
- Usuario normal denegado:
- Level 4 bloqueado:
- Incidentes:

## Decision

Elegir una:

- Go staging
- No-Go staging

Motivo:

## Proximos pasos

1.
2.
3.
