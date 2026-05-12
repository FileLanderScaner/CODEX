# AhorroYA Feedback Triage Board

Use this board to convert feedback into product decisions.

## Severity Definitions

| Severity | Definition | Response |
| --- | --- | --- |
| CRITICAL | Blocks search, breaks trust, exposes security/payment risk, or prevents controlled testing | Stop cohort and fix immediately |
| HIGH | Major confusion, mobile usability issue, broken share, or Premium/payment misunderstanding | Fix before expanding cohort |
| MEDIUM | Repeated friction that lowers conversion or trust | Schedule next product cycle |
| LOW | Cosmetic issue or copy preference | Batch with polish work |
| IDEA | Future feature request | Add to roadmap only after repeated demand |

## Triage Matrix

| Problem reported | User/segment | Severity | Frequency | Conversion impact | Trust impact | Recommended action | Suggested Codex cycle |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cannot find search input | | CRITICAL/HIGH | | High | Medium | Improve first-screen CTA/search prominence | UX_REFINEMENT |
| Does not trust prices | | HIGH | | Medium | High | Add source/freshness/estimate copy | TRUST_AND_COPY_POLISH |
| Savings unclear | | HIGH | | High | Medium | Improve savings badge and comparison copy | UX_REFINEMENT |
| WhatsApp share not used | | MEDIUM | | Medium | Low | Improve share CTA and message | GROWTH_LOOP_POLISH |
| Premium value unclear | | MEDIUM | | Medium | Medium | Rewrite Premium benefits and CTA | MONETIZATION_COPY_POLISH |
| Mobile layout crowded | | HIGH | | High | Medium | Mobile layout polish | MOBILE_POLISH |
| Payment live confusion | | HIGH | | Medium | High | Clarify sandbox/live status | PAYMENTS_COPY_GUARDRAILS |
| Feature request repeated by 3+ users | | IDEA | | TBD | TBD | Add to roadmap with evidence | PRODUCT_ROADMAP_UPDATE |

## Prioritization Rules

1. Fix CRITICAL before inviting more users.
2. Fix HIGH before expanding beyond 25 users.
3. Prioritize issues that affect search completion, savings understanding, trust, or sharing.
4. Do not prioritize visual polish over activation blockers.
5. Do not build complex features unless repeated feedback proves demand.
