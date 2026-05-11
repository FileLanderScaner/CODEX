# AhorroYA Real User QA Run Report

Date: 2026-05-11

## Scope

QA run for controlled first-user launch readiness on staging/preproduction. This report does not authorize production.

## Environment

| Item | Result |
| --- | --- |
| Branch | `codex/preprod-hardening-auth-paypal` |
| Branch alias | `https://codex-git-codex-preprod-hardening-auth-paypal-akuma424-projects.vercel.app` |
| Resolved deployment | `https://codex-r6hh4nksm-akuma424-projects.vercel.app` |
| Vercel target | `preview` |
| Vercel status | `Ready` |
| Public HTTP | `401`, expected with Deployment Protection |
| Production | `NO-GO_PRODUCTION` |

## Checklist Result

| Area | Status | Evidence |
| --- | --- | --- |
| Preview readiness | PASS | Vercel inspect shows target `preview`, status `Ready` |
| Deployment Protection | PASS | Public request returns `401` |
| Tracking events | PASS | Required events exist in app, screens, tracking service, server metrics, and tests |
| WhatsApp loop | PASS | Share/copy copy and tracking are documented and implemented |
| Premium CTA | PASS | CTA event and Premium matrix exist |
| PayPal mode | PASS | Sandbox remains the only approved payment mode |
| AI agents | PASS | Agents remain disabled by gate documentation and checks |
| Production safety | PASS | No production deploy, promote, env mutation, or migration performed |

## Tracking Evidence

Required first-user events are present:

- `app_opened`
- `search_completed`
- `savings_calculated`
- `whatsapp_share_clicked`
- `premium_cta_clicked`

Server-side monetization metrics also aggregate these canonical events.

## Manual Tester Instructions

Each tester should run:

1. Open the staging branch alias.
2. Search `yerba`.
3. Search `leche`.
4. Search a missing product.
5. Open a product result.
6. Share or copy an estimated savings result.
7. Open Premium CTA.
8. Report confusion, missing products, trust concerns, and mobile issues.

## Known Limits

- Browser-level E2E with authenticated user states is not yet automated in this cycle.
- Public preview access is intentionally protected; testers need approved preview access or a safe protected-preview flow.
- Production remains blocked by external credentials and operational evidence.

## Decision

```text
REAL_USER_QA_STAGING=PASS_FOR_CONTROLLED_LAUNCH
PRODUCTION_STATUS=NO-GO_PRODUCTION
```
