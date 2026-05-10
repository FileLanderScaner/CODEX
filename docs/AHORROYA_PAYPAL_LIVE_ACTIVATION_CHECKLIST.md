# AhorroYA PayPal Live Activation Checklist

Date: 2026-05-10

## Status

```text
PAYPAL_LIVE_READY=false
BLOCKED_PAYPAL_LIVE_CREDENTIALS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

This checklist must be completed before any live PayPal activation. Do not store secrets in this document.

## Required Live Credentials

Configure these only in the secure production environment:

- `PAYPAL_ENV=live`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`

Never commit `.env`, `.env.local`, `.env.rls`, Vercel env exports, dashboard screenshots containing secrets, or raw credential values.

## PayPal Dashboard Tasks

1. Create or verify the live PayPal app.
2. Create live monthly and yearly subscription plans.
3. Register the production webhook URL.
4. Subscribe the webhook to:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `PAYMENT.CAPTURE.COMPLETED` if legacy order compatibility remains enabled
5. Copy the live webhook ID into secure production env only.
6. Confirm the webhook URL does not expose a real bypass token in documentation.

## Verification Before Live

Run safe checks:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run staging:check
npm run production:check
npm run test:rls
```

Then verify without printing values:

- Production env contains all required PayPal variable names.
- `PAYPAL_ENV` is still `sandbox` until the final live window.
- Webhook handler verifies signatures.
- Subscription activation enables Premium.
- Suspension, expiration, payment failure, and non-renewal disable Premium.
- Logs contain no credentials.

## Live Cutover Gate

Live activation is allowed only when:

- Production backup exists.
- Revert plan is approved and current.
- Vercel Production envs are complete.
- Google OAuth production redirect URIs are configured.
- Supabase Auth leaked password protection is verified.
- PayPal live credentials and webhook are verified.
- One controlled live subscription can be tested safely.

## Prohibited Until Gate Passes

```text
npx vercel deploy --prod
vercel promote
PAYPAL_ENV=live
Production env mutation without secure credential source
```

## Rollback

If live payment validation fails:

1. Restore `PAYPAL_ENV=sandbox` or disable Premium checkout from production env.
2. Remove or pause live webhook delivery in PayPal dashboard.
3. Keep signed webhook handling enabled for sandbox/staging.
4. Re-run production-safe checks.
5. Document the failed gate without exposing credential values.
