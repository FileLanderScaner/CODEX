# AhorroYA PayPal staging setup - 2026-05-08

## Estado

Estado PayPal: `PAYPAL_SANDBOX_READY`.

Entorno usado: PayPal REST API sandbox.

No se uso PayPal live, NVP/SOAP, deploy production ni variables de Production en Vercel.

## Preview URL

Preview base URL estable para validacion sandbox:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app
```

Webhook URL configurada/recomendada:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal
```

El deployment Preview esta protegido por Vercel Deployment Protection. Sin bypass, las llamadas publicas al Preview devuelven 401 antes de llegar a la app.

Para PayPal Sandbox contra un Preview protegido, usar Protection Bypass for Automation y configurar el webhook con query parameter:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

Estado del bypass: presente y validado. No guardar el bypass secret en el repo. No usar este patron en produccion sin revision de seguridad. Alternativa futura recomendada: dominio staging estable sin Deployment Protection para webhooks externos, o dominio production real cuando el release este aprobado.

Ruta nueva/canonica:

```text
/api/v1/billing/webhooks/paypal
```

Ruta legacy compatible:

```text
/api/paypal/webhook
```

Ruta invalida para este repo:

```text
/api/v1/billing/webhook
```

## Evidencia de rutas

- `api/[...path].js` registra `v1/billing/webhooks/paypal`.
- `api/v1/billing/webhooks/paypal.js` delega al router dinamico.
- `server/api/v1/billing/webhooks/paypal.js` re-exporta `server/api/paypal/webhook.js`.
- `api/[...path].js` conserva ruta legacy `paypal/webhook`.

## Variables locales

`.env.local` contiene solo variables publicas `EXPO_PUBLIC_*`.

PayPal public:

- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`: presente.

PayPal server/staging:

- `PAYPAL_ENV=sandbox`.
- `PAYPAL_CLIENT_ID`: presente.
- `PAYPAL_CLIENT_SECRET`: presente, server-only.
- `PAYPAL_WEBHOOK_ID`: presente.
- `PAYPAL_MONTHLY_PLAN_ID`: presente.
- `PAYPAL_YEARLY_PLAN_ID`: presente.

## Recursos PayPal sandbox creados

Producto sandbox:

```text
PROD-0BU36273X09974129
```

Plan mensual sandbox:

```text
P-6U716511BB093204YNH7MHLQ
```

Plan anual sandbox:

```text
P-1DR07576L5006620YNH7MHLY
```

Webhook sandbox activo:

- `PAYPAL_WEBHOOK_ID`: `3JD19417P19777723`.
- URL esperada: `https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal`.
- URL configurada para Preview protegido: `https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>`.
- Eventos configurados en PayPal Sandbox: All Events.

Eventos esperados:

- `BILLING.SUBSCRIPTION.CREATED`.
- `BILLING.SUBSCRIPTION.ACTIVATED`.
- `BILLING.SUBSCRIPTION.CANCELLED`.
- `BILLING.SUBSCRIPTION.SUSPENDED`.
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`.
- `PAYMENT.SALE.COMPLETED`.
- `PAYMENT.CAPTURE.COMPLETED`.

## Manual Dashboard action

Confirmar manualmente en PayPal Developer Dashboard que el webhook sandbox apunta al branch alias:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

No imprimir el bypass token real. No usar credenciales live. Si PayPal sigue apuntando a una URL de deployment efimera, actualizarlo manualmente al branch alias antes de repetir smoke sandbox.

## Vercel Preview

Variables cargadas/actualizadas solo en Preview branch `codex/production-deploy-ready`:

- `EXPO_PUBLIC_API_BASE_URL`.
- `EXPO_PUBLIC_APP_URL`.
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`.
- `ALLOWED_ORIGINS`.
- `PAYPAL_ENV`.
- `PAYPAL_CLIENT_ID`.
- `PAYPAL_CLIENT_SECRET`.
- `PAYPAL_WEBHOOK_ID`.
- `PAYPAL_MONTHLY_PLAN_ID`.
- `PAYPAL_YEARLY_PLAN_ID`.

No se modifico Vercel Production.

## Checks

| Comando | Resultado |
|---|---:|
| `npm run staging:check` | OK, `mode=staging_ready` |
| `node scripts/rls-agent-user-smoke.mjs` | OK, `rls_validation: PASS` |
| `npm run test:rls` | BLOCKED por `psql` no instalado en el entorno local |
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | OK, 68 tests |
| `npm run build` | OK |
| `npm run production:check` | OK tecnico, `mode=staging_ready` |

Deployment Protection:

| Check | Resultado |
|---|---:|
| `GET /api/v1/health` sin bypass | 401 |
| `GET /api/v1/health` con bypass | 200 |
| `GET /api/v1/readiness` con bypass | 200 |
| `OPTIONS /api/v1/billing/webhooks/paypal` con bypass | 204 |

Ultima verificacion:

| Check | Resultado |
|---|---:|
| `npm run staging:check` | OK, `mode=staging_ready` |
| `OPTIONS /api/v1/billing/webhooks/paypal` con bypass | 204 |
| PayPal REST `simulate-event` por webhook ID | Accepted, sin POST visible en Vercel logs |
| PayPal REST `simulate-event` por URL con bypass | Accepted, POST visible en Vercel logs |
| Vercel Preview webhook POST simulado antes del fix | 500 |
| Vercel Preview webhook POST simulado despues del fix | 401 controlado |

El POST externo desde PayPal Sandbox alcanza el webhook Preview protegido, por lo que la ruta y el bypass funcionan. Despues del fix, el evento simulado por URL ya no causa 500: falla de forma controlada en `verify_signature` con `paypal_signature_verification_failed`, manteniendo la verificacion de firma activa. Para validacion definitiva, ejecutar una suscripcion sandbox real aprobada por buyer sandbox para generar eventos firmados contra el webhook registrado.

## Proximo paso

Configurar PayPal Sandbox con:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

No ejecutar production sin aprobacion explicita.

Para crear una suscripcion sandbox real y obtener la URL de aprobacion del buyer:

```powershell
npm run paypal:sandbox:create-subscription -- --preview-url=https://codex-akuma424424-akuma424-projects.vercel.app
```

El script usa PayPal REST API sandbox, no imprime `PAYPAL_CLIENT_SECRET`, no guarda tokens y devuelve solo `PAYPAL_SUBSCRIPTION_ID`, `PAYPAL_PLAN_ID`, `PAYPAL_CUSTOM_ID` y `APPROVAL_URL`.

## Suscripcion sandbox real

Estado actual: `PAYPAL_WEBHOOK_REAL_EVENT_DELIVERED`, `PAYPAL_SIGNATURE_VERIFIED`, `PAYPAL_WEBHOOK_PROCESSING_FIX_PENDING_DEPLOY`.

- Subscription ID: `I-BUMBH66SEMAW`.
- Plan usado: `P-6U716511BB093204YNH7MHLQ`.
- Estado PayPal: `APPROVAL_PENDING`.
- Evento real recibido: `BILLING.SUBSCRIPTION.CREATED`.
- Firma PayPal: verificada correctamente.
- Resultado previo al primer fix: 502 en etapa `supabase_update` porque la suscripcion de prueba fue creada con `custom_id=sandbox-validation-...`, que no es un UUID de usuario interno.
- Resultado con usuario staging real: firma verificada, pero `supabase_update` falla porque Supabase REST staging devuelve `PGRST205` para `subscriptions`.
- Estado de almacenamiento: `BLOCKED_SUPABASE_SCHEMA`; no se aplicaron migraciones remotas.
- Comportamiento corregido para staging: eventos firmados con almacenamiento opcional no disponible devuelven 202 `accepted_pending_storage`, sin desactivar firma y sin marcar procesamiento Supabase como exitoso.
- Resultado despues del deploy del fix: evento real `BILLING.SUBSCRIPTION.CREATED` con ID `WH-5UG88567EP0492624-6NK49054Y5188582B` devolvio HTTP 202, firma verificada y accion `storage_unavailable`.
- Suscripcion usada para esta validacion: `I-G3M126LWGLBW`.
- Estado final PayPal/Vercel: `PAYPAL_WEBHOOK_REAL_EVENT_DELIVERED`, `PAYPAL_SIGNATURE_VERIFIED`, `PAYPAL_WEBHOOK_DELIVERY_2XX`.
- Reparacion aplicada solo en Supabase staging autorizado `wzwjjjajmyfwvspxysjb`: `scripts/sql/staging-fix-subscriptions-schema.sql`.
- Estado Supabase: `SUBSCRIPTIONS_SCHEMA_READY`; `public.subscriptions` visible por REST/Data API, RLS activo y policies owner/admin/internal_job presentes.
- Resultado final despues de la reparacion: nueva suscripcion sandbox `I-F4WJMV10442E`, evento real `BILLING.SUBSCRIPTION.CREATED`, firma verificada, accion `subscription_recorded`, registro persistido en `public.subscriptions`.
- Estado final PayPal/Vercel/Supabase: `PAYPAL_WEBHOOK_PROCESSING_PASS`, `PREVIEW_VALIDATED`.

Despues de aprobar la suscripcion en PayPal Sandbox, validar PayPal Event Logs y Vercel Preview logs. El resultado esperado es delivery HTTP 2xx, sin `paypal_signature_verification_failed`, sin 500 y con procesamiento o ignorado controlado segun el evento recibido.

Para validar procesamiento completo contra Supabase staging, crear una suscripcion con el usuario normal RLS staging como `custom_id`:

```powershell
npm run paypal:sandbox:create-subscription -- --preview-url=https://codex-akuma424424-akuma424-projects.vercel.app --use-rls-normal-user
```

El script no imprime email, password ni secretos; solo indica que el `custom_id` salio de `rls_normal_user`.
