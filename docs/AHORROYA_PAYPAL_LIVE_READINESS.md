# AhorroYA PayPal Live Readiness

Date: 2026-05-11

## Final Status

```text
PAYPAL_SANDBOX_READY
BLOCKED_PAYPAL_LIVE_CREDENTIALS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Sandbox Ready Evidence

- Backend creates PayPal subscriptions through `/api/v1/billing/subscriptions/create`.
- Webhook verifies PayPal signature before processing.
- Subscription states are persisted in `subscriptions`.
- Premium entitlement is enabled only for active subscriptions.
- Premium entitlement is disabled for suspended, expired, and payment-failed states.
- Cancellation keeps access only when PayPal provides a future period end.
- Logs avoid secrets.
- Tests cover webhook signature, subscription creation/activation/cancellation, and safe failures.

## Live Missing Items

Required external PayPal live items:

- `PAYPAL_CLIENT_ID` live.
- `PAYPAL_CLIENT_SECRET` live.
- `PAYPAL_WEBHOOK_ID` live.
- Live monthly plan/product.
- Live yearly plan/product.
- Production webhook URL.
- Live signature verification test.
- Controlled live subscription test.

Do not invent or commit these values.

## Activation Rule

Live is blocked until every missing item is configured in secure deployment environment and verified without printing values.

Do not set:

```text
PAYPAL_ENV=live
```

until production release gates pass.
