# PayPal sandbox runbook

## Variables requeridas

```env
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_MONTHLY_PLAN_ID=
PAYPAL_YEARLY_PLAN_ID=
EXPO_PUBLIC_PAYPAL_CLIENT_ID=
APP_URL=https://<staging-domain>
```

## Dashboard PayPal

1. Crear REST app sandbox.
2. Crear planes de suscripcion mensual/anual.
3. Configurar webhook hacia:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

4. Suscribir eventos:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.CAPTURE.COMPLETED`

El bypass real de Vercel Deployment Protection debe configurarse solo en PayPal Dashboard o en el mecanismo seguro aprobado. No imprimirlo, no guardarlo en Git y no usarlo para production sin revision de seguridad.

## Verificacion

- El webhook debe validar firma con `PAYPAL_WEBHOOK_ID`.
- La compra sandbox debe crear/actualizar `subscriptions`.
- Perfil debe quedar con `is_premium=true` y `premium_until`.
- Premium demo no debe presentarse como pago real.
- Si el webhook no apunta al branch alias, actualizarlo manualmente antes del smoke.

## Paso a live

No cambiar `PAYPAL_ENV=live` hasta:

- Sandbox end-to-end aprobado.
- Webhook live creado.
- Plan IDs live configurados.
- Smoke de rollback documentado.
