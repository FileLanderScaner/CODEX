# AhorroYA staging release candidate summary - 2026-05-08

## Estado final

`STAGING_RELEASE_CANDIDATE_READY`.

## Validaciones pasadas

- `npm run staging:check`: PASS, `mode=staging_ready`.
- `node scripts/rls-agent-user-smoke.mjs`: PASS, `rls_validation: PASS`.
- PayPal real webhook delivery: 2xx.
- PayPal signature: verified.
- Supabase subscriptions schema: ready.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run test`: PASS, 77 tests.
- `npm run build`: PASS.
- `npm run production:check`: PASS tecnico, `mode=staging_ready`.

## Cambios principales

- PayPal webhook hardening.
- Manejo controlado de firma invalida.
- Eventos no soportados o sin identidad interna valida no causan 500.
- Creacion de suscripcion sandbox real para validacion E2E.
- Fix idempotente para `public.subscriptions` en Supabase staging.
- Documentacion de staging actualizada.

## Pendiente conocido

- `npm run test:rls` bloqueado localmente por falta de `psql`.
- Production sigue `NO-GO` hasta completar y aprobar checklist production.

## Confirmaciones

- Production no fue tocada.
- No se uso `--prod`.
- No se commitearon secretos.
- No se activaron agentes IA.
- PayPal sigue sandbox.
- URL webhook documentada con bypass redaccionado:

```text
<preview-url>/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```
