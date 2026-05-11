# AhorroYA PayPal Live Readiness Evidence

Date: 2026-05-11

## Status

```text
PAYPAL_LIVE_STATUS=BLOCKED_EXTERNAL_CREDENTIALS
PAYPAL_SANDBOX_STATUS=READY
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Current Evidence

- Sandbox subscription flow is implemented.
- Sandbox webhook handling verifies PayPal signatures before processing.
- Subscription lifecycle events are handled without uncontrolled 500s.
- Logs are designed to avoid secrets.
- PayPal live is not active.

## External Evidence Required

| Requirement | Source | Owner | Evidence expected | Ready condition |
| --- | --- | --- | --- | --- |
| Live REST app | PayPal Developer Dashboard | Payments owner | Live app exists; client id recorded outside repo; secret stored only in deployment secret store | Live app exists and owner attests credentials are stored securely |
| Live subscription product | PayPal Developer Dashboard | Payments owner | Product id, redacted screenshot, currency/price checked | Product is active and matches Premium offer |
| Live monthly/yearly plans | PayPal Developer Dashboard | Payments owner | Plan ids stored in Production env; redacted plan summary | Plans are active and mapped to app envs |
| Live webhook | PayPal Developer Dashboard | Payments owner | Webhook id and production URL redacted | Webhook subscribes to required subscription events |
| Signature verification | PayPal event logs + app logs | Payments + Security | `verification_status=SUCCESS` or app action showing verified processing | A signed live webhook is verified and processed |
| Controlled subscription | PayPal live account | Payments + Release | Subscription created, activated, cancelled/refunded if needed | Lifecycle is proven without exposing customer data |

## Required Live Env Names

Values must be stored only in Vercel Production envs or equivalent secret storage:

```text
PAYPAL_ENV=live
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_MONTHLY_PLAN_ID
PAYPAL_YEARLY_PLAN_ID
EXPO_PUBLIC_PAYPAL_CLIENT_ID
```

Do not commit values. Do not paste values into docs, chat, issues, or logs.

## Required Webhook Events

Based on PayPal Subscriptions webhook documentation:

- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.REFUNDED`
- `PAYMENT.SALE.REVERSED`

## Safe Verification Commands

These commands are for the human operator to run only after live credentials are securely configured. They must not print secret values.

```powershell
npm run production:check
```

Manual dashboard checks:

```text
PayPal Developer Dashboard > Apps & Credentials > Live app
PayPal Developer Dashboard > Webhooks > production webhook URL
PayPal Developer Dashboard > Event logs > signed delivery 2xx
```

## Risk If Omitted

- Users can pay without entitlement being granted.
- Invalid webhooks could alter subscription state.
- Live payments can fail without clear recovery.
- Refund/cancellation state can drift from app state.

## Source References

- PayPal subscription webhook events: https://developer.paypal.com/docs/subscriptions/reference/webhooks/
- PayPal webhook signature verification: https://developer.paypal.com/docs/api/webhooks/v1/

## Ready Condition

Set `PAYPAL_LIVE_STATUS=READY` only when all external evidence above exists, values are stored securely, a controlled live subscription is verified, and production release approval exists.
