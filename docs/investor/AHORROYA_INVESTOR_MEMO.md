# AhorroYA Investor Memo

Date: 2026-05-11

## Executive Summary

AhorroYA is a Uruguay-first price comparison and savings platform for grocery and household purchases. The product helps users search products, compare available supermarket prices, estimate savings, share findings by WhatsApp, save favorites, and receive price alerts.

Current status: staging/preproduction is ready for a controlled first-100-users validation. Production is intentionally blocked until external production gates are complete.

## Problem

Households in Uruguay and LATAM face recurring grocery inflation, fragmented supermarket catalogs, and high friction when comparing prices across stores. Consumers often rely on memory, screenshots, group chats, or manual browsing. This creates wasted time, missed savings, and low confidence in where to buy.

## Solution

AhorroYA provides a simple comparison workflow:

1. Search a product.
2. See available prices and the cheapest known option.
3. View estimated savings.
4. Share the result through WhatsApp.
5. Save favorites or create alerts.
6. Upgrade to Premium for deeper savings tools.

Core promise:

```text
AhorroYA te muestra donde comprar mas barato en segundos.
```

## Target Market

Initial wedge:

- Montevideo shoppers comparing supermarket basics.
- Families managing repeated household purchases.
- Students and workers optimizing weekly grocery spend.
- WhatsApp-first communities and neighborhood groups.

Expansion path:

- Uruguay national coverage.
- LATAM markets with high grocery price fragmentation.
- B2B insights for brands, local commerce, and retailers.

## Current Product

Built:

- Expo/React Native Web frontend.
- Product search and comparison experience.
- Cheapest-price and estimated-savings UI.
- WhatsApp share and copy fallback.
- Favorites and alerts flows.
- Premium paywall and feature matrix.
- PayPal sandbox subscription integration.
- Internal tracking with local fallback.
- Supabase RLS validation.
- Vercel Preview/Staging readiness.

Not production-ready:

- PayPal live is not active.
- Production envs are not verified.
- Google OAuth production is not externally verified.
- Supabase production Auth leaked password protection is not evidenced.
- Production backup/revert evidence is pending.

## Competitive Advantage

Near-term advantages:

- Local Uruguay focus.
- WhatsApp-native viral loop.
- Practical savings UX rather than generic catalog browsing.
- Built-in monetization architecture through Premium.
- Security-conscious staging/release gates.

Longer-term advantages depend on execution:

- Proprietary price observations and user search data.
- Local retail partnerships.
- Retention through alerts/favorites.
- B2B insight products.

## Real Technical State

Staging:

- `STAGING_STATUS=READY_FOR_FIRST_100_USERS`
- `CODEX_AUTO_APPROVAL_GATE=PASS_PREPROD`
- Tests/build/checks pass.
- RLS passes via Supabase Session Pooler.
- AI agents disabled and kill-switch protected.

Production:

- `PRODUCTION_STATUS=NO-GO_PRODUCTION`
- Not promoted.
- No `vercel --prod`.
- No production env mutation.
- No production migrations.

## Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Insufficient live price coverage | High | First 100 users should validate top repeated products and missing-data workflows |
| PayPal live not configured | High | Keep production NO-GO until live credentials/webhook/test are complete |
| OAuth production not verified | Medium | Complete Google OAuth production redirect verification |
| Consumer trust | High | Use cautious copy: "precios disponibles", "ahorro estimado" |
| Marketplace competition | Medium | Focus on local WhatsApp loop and savings proof |
| Data quality | High | Add reporting, moderation, and official/partner source labeling |

## Next Milestones

1. Close production blockers.
2. Run first 100 users on staging/preview.
3. Measure activation and WhatsApp sharing.
4. Validate Premium willingness to pay.
5. Complete PayPal live and OAuth production gates.
6. Pursue local partnerships and data coverage.

## What Can Be Shown Today

- Staging product demo.
- Search and comparison workflow.
- WhatsApp share loop.
- Premium paywall and sandbox subscription flow.
- Security/release documentation.
- First-100-users plan.
- Technical architecture and RLS evidence.

## What Must Not Be Presented As Ready

- Production launch.
- PayPal live revenue.
- Verified live payments.
- Real traction beyond documented staging readiness.
- Guaranteed savings.
- Real-time price coverage unless proven source-by-source.
- Production-grade Google OAuth.
- Fully verified production security posture.
