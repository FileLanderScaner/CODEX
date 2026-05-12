# AhorroYA First 100 Metrics Dashboard Spec

## Purpose

Track whether controlled users activate, trust the product, share savings, and show Premium intent.

## Core Funnel

| Step | Event | Success Signal |
| --- | --- | --- |
| App opened | `app_opened` | User reaches first screen |
| Landing understood | manual feedback | User explains value in 5 seconds |
| Search started | `search_started` | User enters or taps a product |
| Search completed | `search_completed` | Results appear |
| Cheapest price seen | `cheapest_price_seen` | User sees lowest option |
| Savings calculated | `savings_calculated` | User sees estimated saving |
| Share clicked | `whatsapp_share_clicked` | User tries viral loop |
| Copy clicked | `savings_copied` | Fallback share intent |
| Premium CTA seen | `premium_cta_seen` | User is exposed to monetization |
| Premium CTA clicked | `premium_cta_clicked` | User shows purchase interest |

## Manual Metrics

| Metric | Collection Method | Target |
| --- | --- | --- |
| Value understood in 5 seconds | Interview/form | 70%+ |
| Search completion | Observation/event | 70%+ |
| Price trust | Form score | 3.5/5+ |
| Would use again | Form score | 40%+ yes |
| Would recommend/share | Form score/event | 25%+ |
| Premium interest | Form/event | 10%+ |

## Dashboard Views

1. Funnel conversion by cohort.
2. Top failed steps.
3. Top feedback themes.
4. Bugs by severity.
5. Premium interest by segment.
6. Share intent by product category.

## Data Safety

- Do not store secrets in feedback.
- Avoid collecting unnecessary personal data.
- Do not collect payment credentials.
- Do not expose staging bypass tokens in dashboard exports.
- Label all data as controlled staging feedback until production is approved.
