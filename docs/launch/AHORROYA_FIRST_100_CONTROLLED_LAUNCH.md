# AhorroYA First 100 Controlled Launch

Date: 2026-05-11

## Decision

```text
FIRST_100_USERS_CONTROLLED_LAUNCH_READY
STAGING_STATUS=READY_FOR_FIRST_100_USERS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

This launch is approved only for staging/preproduction validation with controlled testers. It is not a production launch and must not be advertised as a final live service.

## Verified Preview Target

- Branch: `codex/preprod-hardening-auth-paypal`
- Branch alias: `https://codex-git-codex-preprod-hardening-auth-paypal-akuma424-projects.vercel.app`
- Resolved deployment: `https://codex-r6hh4nksm-akuma424-projects.vercel.app`
- Vercel target: `preview`
- Vercel status: `Ready`
- Public HTTP behavior: `401`, expected because Deployment Protection is enabled.

No Vercel Production deployment, promotion, or Production env mutation was performed.

## Launch Scope

Allowed:

- Invite controlled first testers through WhatsApp, Instagram, family/friends, and small Uruguay-focused groups.
- Use staging/preproduction wording.
- Collect feedback about search quality, trust, zero-results, and Premium interest.
- Review internal tracking events.

Not allowed:

- Claim production readiness.
- Claim guaranteed savings.
- Claim real-time data unless independently validated.
- Activate PayPal live.
- Use real payment credentials.
- Disable Deployment Protection.
- Use `vercel --prod` or `vercel promote`.

## User Promise

Primary copy:

```text
AhorroYA te muestra donde comprar mas barato en segundos.
```

Safe supporting copy:

- Compara precios disponibles.
- Encontra oportunidades de ahorro.
- Ahorro estimado.
- Precios sujetos a disponibilidad.
- Verifica siempre antes de comprar.

## First 100 Funnel

| Step | User action | Expected signal |
| --- | --- | --- |
| 1 | Opens staging link | `app_opened` |
| 2 | Understands value proposition | `landing_viewed` |
| 3 | Searches product | `search_started` |
| 4 | Receives comparison | `search_completed` |
| 5 | Sees cheapest price | `cheapest_price_seen` |
| 6 | Understands estimated savings | `savings_calculated` |
| 7 | Shares or copies result | `whatsapp_share_clicked` or `savings_copied` |
| 8 | Sees Premium value | `premium_cta_seen` |
| 9 | Opens Premium CTA | `premium_cta_clicked` |

## Launch Cohort

Start with 15 direct testers before posting in larger groups.

Target profiles:

- Montevideo shoppers comparing repeated grocery items.
- Families buying weekly basics.
- Students and workers looking for immediate savings.
- Users active in WhatsApp neighborhood groups.

## 48-Hour Success Signals

- At least 10 app opens.
- At least 5 completed searches.
- At least 3 users see estimated savings.
- At least 1 WhatsApp share or copy event.
- At least 1 Premium CTA click.
- No reported secret exposure.
- No production action performed.

## 7-Day Success Signals

- 100 app opens from controlled channels.
- 50 searches.
- 25 users see a cheapest price.
- 10 WhatsApp shares or copied savings messages.
- 5 Premium CTA clicks.
- Top zero-result products identified.

## Stop Conditions

Stop the launch and triage before adding more users if any of these happen:

- Staging Preview stops resolving to `Ready`.
- Deployment Protection is disabled unexpectedly.
- Search breaks for common products.
- PayPal sandbox webhook starts returning uncontrolled 500s.
- Any secret appears in logs, UI, docs, or client output.
- AI agents become enabled.
- Production status changes away from `NO-GO_PRODUCTION` without full gate evidence.

## Next Mode

The next technically valuable mode is `PRODUCTION_BLOCKERS_CLOSEOUT`, but it must not be executed against real production resources without external credentials and evidence. Safe work can continue as documentation, QA, and controlled staging launch execution.
