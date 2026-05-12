# AhorroYA Final GO / NO-GO Matrix

## Decision Summary

| Area | Decision | Evidence | Notes |
| --- | --- | --- | --- |
| Protected staging demo | GO | Staging checks, build, tests, RLS pass | Must disclose protected staging status |
| First 100 controlled users | GO | Launch docs, feedback prep, visual/accessibility cycles | Controlled group only |
| Public production | NO-GO | External blockers remain | Do not deploy/promote production |
| PayPal sandbox | GO | Sandbox docs and checks | Safe for non-live validation |
| PayPal live | NO-GO | Live credentials and live webhook evidence missing | No real charges |
| Google OAuth production | NO-GO | Production OAuth evidence missing | Staging auth may be shown only as staging |
| AI agents | NO-GO for activation | Defaults remain disabled | Architecture/docs only |

## Conditions For Production Candidate

Production can become a candidate only when all of the following are true:

1. Production env names are verified in Vercel without exposing values.
2. PayPal live credentials, live plans, live webhook id, signature verification, and controlled live subscription evidence are complete.
3. Google OAuth production client and exact redirect URIs are verified with a production-domain login smoke.
4. Supabase Auth leaked password protection has redacted dashboard evidence.
5. Production SQL backup exists and restore availability is confirmed.
6. Revert/rollback drill is evidenced or explicitly accepted by the production owner.
7. Lint, typecheck, tests, build, staging check, production check, and RLS pass again.
8. Secret scan passes.
9. AI Gateway and AI agents remain disabled unless a separate production-safe gate is approved.
10. Human release owner approves a release window and rollback owner.

## Current Final Decision

```text
GO_CONTROLLED_FIRST_100_USERS
NO-GO_PUBLIC_PRODUCTION
PRODUCTION_STATUS=NO-GO_PRODUCTION
```
