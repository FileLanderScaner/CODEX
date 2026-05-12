# AhorroYA First 100 User Test Plan

Date: 2026-05-12

Status: `FIRST_100_USER_TEST_EXECUTION_TRACKER=READY_PENDING_FINAL_CHECKS`

Production: `NO-GO_PRODUCTION`

## Objective

Validate whether controlled real users understand AhorroYA, find savings, trust the experience, and would share or return before any public production launch.

## Ideal User Profile

- Lives in Uruguay or buys groceries for a Uruguay household.
- Compares supermarket prices manually or wants to reduce grocery spending.
- Uses WhatsApp frequently.
- Can test on mobile first.
- Is willing to give direct feedback within 48 hours.

Priority segments:

1. Parents or household buyers comparing weekly purchases.
2. Students or workers with fixed monthly budgets.
3. Neighborhood shoppers who already use WhatsApp groups.
4. Small commerce owners curious about price visibility.

## Invitation Method

- Invite 10 users first, then expand to 25, 50, and 100 only if critical bugs stay low.
- Use direct WhatsApp messages, small trusted groups, and one-to-one calls.
- State clearly that this is a protected staging/preproduction test.
- Do not claim production readiness or live payments.

## Demo Script

1. Open protected staging.
2. Explain: "AhorroYA te muestra donde comprar mas barato en segundos."
3. Ask the user to search for a common product.
4. Ask what they think the cheapest result means.
5. Ask them to open a product detail.
6. Ask them to share the estimated savings through WhatsApp or copy fallback.
7. Show the Premium CTA and ask which benefit would make them pay.
8. Explain PayPal live is not active yet.

## Minimum Metrics

| Metric | Target For First 100 | Why It Matters |
| --- | --- | --- |
| Value understood in 5 seconds | 70%+ | Tests positioning |
| Search completed | 70%+ | Tests activation |
| Cheapest price understood | 60%+ | Tests product clarity |
| Savings shared/copied | 25%+ | Tests viral loop |
| Would use again | 40%+ | Tests retention signal |
| Premium interest | 10%+ | Tests monetization pull |
| Critical bug rate | Under 5% sessions | Protects trust |

## Decision Criteria

Proceed to next test cohort if:

- No CRITICAL bugs appear.
- At least 70% complete a search.
- Users can describe the value proposition in their own words.
- At least 25% share or copy a savings result.

Pause and fix if:

- Users cannot search without help.
- Results are confusing or not trusted.
- Mobile layout blocks the core task.
- Any auth/payment/security issue creates user risk.

## Safety Rules

- Keep `PRODUCTION_STATUS=NO-GO_PRODUCTION`.
- Do not collect real payments.
- Do not use PayPal live.
- Do not expose staging bypass tokens publicly.
- Do not ask users to share secrets or credentials.
