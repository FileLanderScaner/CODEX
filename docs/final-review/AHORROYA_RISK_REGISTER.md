# AhorroYA Final Review Risk Register

| Severity | Risk | Evidence | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| HIGH | PayPal live not verified | Live credentials/webhook evidence missing | Cannot charge real Premium users | Keep sandbox, obtain live credentials, run controlled live test |
| HIGH | Production envs not verified | Vercel Production env evidence missing | Production may fail or expose wrong config | Verify names only through secure process, no value printing |
| HIGH | Google OAuth production not verified | Production OAuth client/redirect evidence missing | Login may fail on production domain | Configure OAuth client and run production-domain smoke after approval |
| HIGH | Supabase Auth leaked password protection not evidenced | Dashboard evidence missing | Weaker auth posture | Capture redacted dashboard evidence before production |
| HIGH | Backup/revert evidence missing | Plans exist but real artifacts/drills absent | Harder rollback after production incident | Create backup artifact and restore/revert evidence |
| MEDIUM | Staging may be mistaken for production | Demo is strong enough to look launch-ready | Overclaiming to users/investors | Use staging-safe demo script and explicit disclaimers |
| MEDIUM | Pricing/savings trust depends on data freshness | Data source freshness can affect perceived value | User distrust or churn | Label savings as estimated and add freshness indicators where possible |
| MEDIUM | Premium value must be validated | Premium matrix exists, but user willingness unknown | Monetization uncertainty | Test Premium CTA interest during first-100 review |
| MEDIUM | Public traffic not exercised | Preview/staging protected | Unknown production-scale behavior | Run controlled public-readiness tests only after production blockers close |
| LOW | AI features are disabled | AI Gateway/agents off by design | No AI-driven growth yet | Keep disabled until separate safe activation gate |

## Current Risk Posture

The project is acceptable for controlled staging review and first-user discovery. It is not acceptable for public production until all HIGH production blockers are resolved with evidence.
