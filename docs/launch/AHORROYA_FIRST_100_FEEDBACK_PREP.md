# AhorroYA First 100 Feedback Prep

Date: 2026-05-12

## Status

```text
FIRST_100_FEEDBACK_PREP=PASS_PENDING_FINAL_CHECKS
STAGING_STATUS=READY_FOR_FIRST_100_USERS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Goal

Collect high-signal feedback from the first controlled users without presenting staging as production and without requesting real payments.

## Feedback Principles

- Ask about observable behavior, not opinions first.
- Keep the survey under 3 minutes.
- Capture search terms, missing products, trust objections, and share intent.
- Separate pricing/Premium interest from live payment readiness.
- Never ask users to paste secrets, passwords, payment data, or private account data.

## First-Session Questions

Use after the first app session:

1. What product did you search first?
2. Did you understand what AhorroYA does in under 5 seconds?
3. Did you find a useful price comparison?
4. Was the estimated savings clear?
5. Did you trust the price/store information? Why or why not?
6. What product or store was missing?
7. Would you share a savings result by WhatsApp?
8. What made you hesitate?
9. Which Premium benefit is most useful: alerts, favorites, history, smart cart, or zone comparison?
10. Would you use this again before your next grocery trip?

## Follow-Up Questions After 48 Hours

1. Did you come back without being reminded?
2. Did AhorroYA change any purchase decision?
3. Did you share it with someone?
4. What result felt wrong or incomplete?
5. What would make it trustworthy enough for weekly use?

## Metrics To Review

| Metric | Success signal | Failure signal |
| --- | --- | --- |
| `app_opened` | 100 controlled users open staging | Users do not open after invite |
| `search_completed` | 50 searches complete | Most users do not search |
| `savings_calculated` | 25 users see savings | Savings is not visible or convincing |
| `whatsapp_share_clicked` | 10 shares/copies | Nobody shares |
| `premium_cta_clicked` | 5 clicks | Premium value is unclear |

## Decision Board

| Signal | If true | Action |
| --- | --- | --- |
| Users fail to understand value | Improve hero/copy/onboarding | `COPYWRITING_POLISH` |
| Users search missing products | Add products/data ingestion | Data expansion cycle |
| Users distrust prices | Add source/timestamp/explanation | Trust UI cycle |
| Users share savings | Increase WhatsApp loop | Growth loop cycle |
| Users click Premium but do not convert | Improve Premium offer/paywall | Monetization UX cycle |
| Users ask for production/live payments | Keep production blocked until gates | Production evidence cycle |

## WhatsApp Follow-Up Message

```text
Gracias por probar AhorroYA. Me sirve mucho una respuesta rapida:

1. Que producto buscaste?
2. Entendiste donde estaba mas barato?
3. Compartirias ese ahorro por WhatsApp?
4. Que producto o super te falto?
5. Pagarias por alertas si te avisara antes de comprar caro?

Version de prueba, no produccion final. Precios sujetos a disponibilidad.
```

## Interview Script

```text
Quiero ver como usas AhorroYA sin explicarte demasiado.

1. Abrí la app.
2. Decime en voz alta qué crees que hace.
3. Buscá un producto que comprarías esta semana.
4. Mostrame qué precio elegirías.
5. Compartí o copiá el ahorro si te parece útil.
6. Decime qué te generó desconfianza.
```

## Safety

- Use staging/preproduction language.
- Do not claim production readiness.
- Do not request real PayPal live payments.
- Do not collect card, password, OAuth, or token data.
- Keep `PRODUCTION_STATUS=NO-GO_PRODUCTION`.
