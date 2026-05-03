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
https://<staging-domain>/api/v1/billing/webhooks/paypal
```

4. Suscribir eventos:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `PAYMENT.CAPTURE.COMPLETED`

## Verificacion

- El webhook debe validar firma con `PAYPAL_WEBHOOK_ID`.
- La compra sandbox debe crear/actualizar `subscriptions`.
- Perfil debe quedar con `is_premium=true` y `premium_until`.
- Premium demo no debe presentarse como pago real.

## Paso a live

No cambiar `PAYPAL_ENV=live` hasta:

- Sandbox end-to-end aprobado.
- Webhook live creado.
- Plan IDs live configurados.
- Smoke de rollback documentado.
