# AhorroYA PayPal Monetization Final

Date: 2026-05-10

## Final Status

- `PAYPAL_SANDBOX_READY`
- `PAYPAL_LIVE_READY=false`
- `BLOCKED_PAYPAL_LIVE_CREDENTIALS`
- `PRODUCTION_STATUS=NO-GO_PRODUCTION`

PayPal Premium is ready for staging/sandbox validation. Live monetization remains blocked until real live credentials and dashboard configuration are provided and verified outside the repository.

## Monetization Architecture

Premium uses PayPal subscriptions as the canonical paid flow:

1. Authenticated user starts checkout from the Premium screen.
2. Client calls `POST /api/v1/billing/subscriptions/create`.
3. Backend creates a PayPal subscription with the configured sandbox plan ID.
4. Backend stores the subscription as `approval_pending`.
5. User approves in PayPal sandbox.
6. PayPal sends a signed webhook to `/api/v1/billing/webhooks/paypal`.
7. Backend verifies the signature with PayPal.
8. Backend updates `subscriptions` and the user premium entitlement.

The legacy one-time order endpoints remain present for backwards compatibility, but Premium activation should use the subscription endpoint.

## Premium Plans

| Plan | Code | PayPal Variable | Status |
| --- | --- | --- | --- |
| Monthly | `premium_monthly` | `PAYPAL_MONTHLY_PLAN_ID` | Sandbox ready |
| Yearly | `premium_yearly` | `PAYPAL_YEARLY_PLAN_ID` | Sandbox ready if configured |

The app must not infer live plan IDs from sandbox IDs.

## Webhook Security

Webhook processing requires:

- `PAYPAL_WEBHOOK_ID`
- PayPal transmission headers
- PayPal signature verification API success
- Valid internal user identity for subscription events
- Supabase service role only on the server

Webhook logs record event metadata and header presence only. Secrets, tokens, credentials, service role keys, and bypass values must never be logged.

## Subscription Status Model

| PayPal Event | Stored Status | Premium Entitlement |
| --- | --- | --- |
| `BILLING.SUBSCRIPTION.CREATED` | `created` or PayPal status | Not premium yet |
| `BILLING.SUBSCRIPTION.ACTIVATED` | `active` | Premium enabled |
| `BILLING.SUBSCRIPTION.CANCELLED` | `cancelled` | Premium kept only when PayPal provides a future period end |
| `BILLING.SUBSCRIPTION.SUSPENDED` | `suspended` | Premium disabled |
| `BILLING.SUBSCRIPTION.EXPIRED` | `expired` | Premium disabled |
| `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | `payment_failed` | Premium disabled |

Client premium detection reads `/api/v1/billing/me`, normalizes status casing, and treats only active, unexpired subscriptions as premium.

## Sandbox Configuration

Required sandbox variables:

- `PAYPAL_ENV=sandbox`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`

The webhook URL for protected preview/staging deployments must use a redacted bypass value in documentation:

```text
https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

## Live Blockers

Live PayPal remains blocked until all of these are complete:

- Live `PAYPAL_CLIENT_ID` exists in the secure deployment environment.
- Live `PAYPAL_CLIENT_SECRET` exists in the secure deployment environment.
- Live `PAYPAL_WEBHOOK_ID` exists in the secure deployment environment.
- Live monthly and yearly PayPal plan IDs are created and configured.
- Production webhook URL is registered in PayPal live dashboard.
- Live webhook signature verification is validated.
- Controlled live subscription test is approved by release owner.
- Production env verification passes without exposing values.

## Safe Activation Rule

Do not set `PAYPAL_ENV=live` unless the live checklist is complete. If any live credential or dashboard item is missing, the only valid state is:

```text
BLOCKED_PAYPAL_LIVE_CREDENTIALS
```
