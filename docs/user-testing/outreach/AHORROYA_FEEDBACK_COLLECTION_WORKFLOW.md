# AhorroYA Feedback Collection Workflow

## Intake

Use one entry per tester:

- Tester id/name:
- Segment:
- Device:
- Date:
- Link version or commit:
- Search completed:
- Shared/copied:
- Premium interest:
- Main quote:
- Main issue:
- Severity:
- Suggested cycle:

## Daily Review

At the end of each test day:

1. Count completed sessions.
2. Count search completion.
3. Count share/copy attempts.
4. Count Premium interest.
5. Group feedback by theme.
6. Flag CRITICAL/HIGH issues.
7. Decide whether to continue, pause, or fix.

## Severity Routing

| Type | Route |
| --- | --- |
| CRITICAL bug | Stop outreach and create fix cycle |
| HIGH conversion issue | Fix before next cohort |
| HIGH trust issue | Improve copy/source/freshness signals |
| MEDIUM repeated friction | Add to next sprint |
| LOW visual issue | Batch with polish |
| IDEA | Track only if repeated |

## Weekly Decision

After the first 10 users:

- Continue to 25 users.
- Pause and run a fix cycle.
- Reject the current positioning and rewrite onboarding.
- Keep production `NO-GO_PRODUCTION`.

After 25 users:

- Expand to 50 if critical issues remain zero.
- Validate Premium interest.
- Identify top two acquisition channels.

After 100 users:

- Decide whether product is ready for a broader beta.
- Decide whether production blockers are worth closing immediately.
- Decide monetization experiment priority.
