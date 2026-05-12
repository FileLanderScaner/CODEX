# AhorroYA Pending Human Actions

## Before Controlled First 100 Users

1. Choose a reviewer/launch owner.
2. Share only the protected staging URL through the intended review channel.
3. Tell participants the app is in staging/preproduction.
4. Use the demo script and feedback questions.
5. Collect feedback within 48 hours.

## Before Production Candidate

1. Supabase owner captures redacted evidence that leaked password protection is enabled.
2. Database owner creates a real production backup and records backup id/location outside the repository.
3. Database owner confirms restore/revert readiness.
4. Vercel owner verifies Production env names and non-placeholder status without printing values.
5. Payments owner configures PayPal live product/plans, live credentials, live webhook id, and controlled live subscription evidence.
6. Auth owner configures Google OAuth production client and exact redirect URIs.
7. Release owner defines release window, rollback owner, and incident contact.
8. Security/release owner re-runs the production gate after evidence is complete.

## Explicitly Prohibited Until Production Candidate

- `vercel --prod`
- `vercel promote`
- Editing Vercel Production envs from this autonomous workflow
- Applying production migrations
- Enabling PayPal live
- Enabling Google OAuth production without evidence
- Enabling AI Gateway or autonomous AI agents in production
- Committing `.env` files or secrets

## Human Review Output Expected

The human reviewer should record one of:

- `APPROVED_CONTROLLED_FIRST_100_USERS`
- `REQUIRES_STAGING_FIXES`
- `PRODUCTION_BLOCKERS_READY_FOR_RELEASE_GATE`
- `PRODUCTION_REMAINS_NO_GO`
