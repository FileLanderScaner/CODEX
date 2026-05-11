# AhorroYA First 100 Users Readiness

Date: 2026-05-11

## Decision

```text
STAGING_STATUS=READY_FOR_FIRST_100_USERS
PRODUCTION_STATUS=NO-GO_PRODUCTION
PAYPAL_STATUS=BLOCKED_PAYPAL_LIVE_CREDENTIALS
```

## Why Staging Is Ready

- User can understand the value quickly.
- User can search a product and see price comparisons.
- User can see estimated savings.
- User can share by WhatsApp or copy text.
- Tracking covers activation, savings, sharing, Premium intent, and checkout start/failure.
- Premium has a clear feature matrix.
- PayPal sandbox subscription flow is implemented.
- RLS checks pass.

## Why Production Remains NO-GO

Production still requires external gates:

- PayPal live credentials and live webhook.
- Production webhook URL confirmation.
- Controlled live subscription test.
- Google OAuth production verification.
- Supabase Auth leaked password protection evidence.
- Production backup and revert execution evidence.
- Production deploy window and release owner.

## Go-To-User Limits

Use staging/preview for first testers. Do not advertise as final production.

Safe phrasing:

- "Estamos validando AhorroYA con precios disponibles."
- "Ahorro estimado."
- "Verifica siempre antes de comprar."

Avoid:

- "Ahorro garantizado."
- "Siempre el precio mas bajo."
- "Datos en tiempo real."
