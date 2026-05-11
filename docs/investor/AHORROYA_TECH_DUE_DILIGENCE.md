# AhorroYA Technical Due Diligence

Date: 2026-05-11

## Summary

AhorroYA has a functioning staging/preproduction product with security gates, tests, Supabase RLS validation, PayPal sandbox subscription plumbing, and first-user growth instrumentation. Production is intentionally blocked.

## Built

- Expo/React Native Web app.
- Node serverless-style API handlers.
- Product search, comparison, favorites, alerts, share flows.
- Premium screen and PayPal subscription checkout path.
- PayPal webhook verification and subscription state handling.
- Supabase-backed data model and RLS tests.
- AI agents architecture with production disabled and kill switch.
- Internal tracking API with local fallback.
- Release gate and audit documentation.

## Partially Built

- Product data coverage: enough for controlled staging validation, not proven at production scale.
- Premium gating: feature matrix and entitlement checks exist, but commercial limits need final policy.
- Growth dashboard: event capture exists; analysis/reporting still early.
- B2B data insights: concept and some protected endpoints exist, but not a mature product.
- PayPal subscriptions: sandbox-ready, live blocked.

## Documented But Pending

- Production backup plan.
- Production revert plan.
- Supabase Auth leaked password protection verification.
- PayPal live activation checklist.
- First 100 users QA and launch plan.
- Investor package and 90-day scale plan.

## Blocked By External Credentials Or Actions

- PayPal live client ID.
- PayPal live client secret.
- PayPal live webhook ID.
- PayPal live product/plan IDs.
- Production webhook URL registration.
- Controlled live subscription test.
- Google OAuth production client and redirect verification.
- Supabase dashboard Auth leaked password protection evidence.
- Vercel Production env verification.

## Security

Current security posture:

- `.env` files are not committed.
- Secret scans report only placeholders and fixtures.
- PayPal webhook logs avoid secrets.
- AI agents disabled by default.
- Production agent endpoint disabled by code.
- AI kill switch implemented.
- Production remains blocked.

Known gaps:

- External production dashboard settings need verification.
- Real production backup/revert evidence is pending.
- Monitoring and incident alerting should be strengthened before production.

## Supabase / RLS

Validated:

- `npm run test:rls` passes.
- `RLS_SESSION_POOLER_DETECTED`.
- `normal_blocked: true`.
- `admin_allowed: true`.
- `internal_job_allowed: true`.
- `rls_validation: PASS`.

Access model:

- Roles come from `auth.jwt()->app_metadata.role`.
- Agent tables are restricted to `admin` and `internal_job`.
- Service role is server-only.

## Vercel / Staging

Staging/preproduction:

- Checks pass.
- Preview/staging is the intended demo target.
- Deployment protection public 401 has been treated as expected in prior validation.

Production:

- Not touched.
- No `--prod`.
- No promote.
- Env values not modified by this branch.

## PayPal

Sandbox:

- Subscription creation endpoint exists.
- Webhook signature verification exists.
- Subscription state model handles activation, cancellation, suspension, expiration, and payment failure.

Live:

- Not ready.
- Blocked by live credentials, live webhook, and controlled live test.

## Google OAuth

Staging:

- Current checks consider Google auth ready for staging.

Production:

- Not externally verified.
- Redirect URIs and production OAuth client evidence pending.

## AI Agents And Kill Switch

Built:

- Agent tables and RLS migration.
- Agent endpoint.
- `AI_KILL_SWITCH`.
- Production endpoint block.
- Safe default flags:
  - `AI_PROVIDER=mock`
  - `AI_GATEWAY_ENABLED=false`
  - `ENABLE_AI_AGENTS=false`
  - `ENABLE_ADMIN_AI_PANEL=false`
  - `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`

Production:

- Agents disabled.
- No autonomous production operation is approved.

## Technical Risk Register

| Risk | Severity | Current mitigation |
| --- | --- | --- |
| Production external config incomplete | High | `NO-GO_PRODUCTION` |
| Data coverage unproven | High | Controlled first-100 validation |
| Live payment path untested | High | Sandbox only, live blocked |
| OAuth production unknown | Medium | Documented blocker |
| Monitoring early-stage | Medium | Add observability before production |
