# AhorroYA Production Blockers Closeout

Date: 2026-05-11

## Decision

```text
PRODUCTION_BLOCKERS_CLOSEOUT_STATUS=READY_FOR_HUMAN_CREDENTIALS_AND_APPROVAL
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

This package closes all work that can be done safely inside the repository. Production is still blocked because the remaining evidence depends on external dashboards, real credentials, real backups, and explicit production approval.

## Current State

| Area | Status |
| --- | --- |
| Staging | `READY_FOR_FIRST_100_USERS` |
| Controlled launch | `FIRST_100_USERS_CONTROLLED_LAUNCH_READY` |
| RLS | `PASS` |
| Vercel Preview | `Ready`, protected by expected public `401` |
| PayPal | `SANDBOX_READY`, live blocked |
| Google OAuth production | blocked by external verification |
| Supabase Auth leaked password protection | blocked by dashboard evidence |
| Production backup/revert evidence | blocked by human execution and evidence |
| Vercel Production envs | blocked by secure verification |
| Production | `NO-GO_PRODUCTION` |

## Blocker Matrix

| Blocker | Classification | What is missing | Evidence required | Ready condition |
| --- | --- | --- | --- | --- |
| Supabase Auth leaked password protection | `BLOCKED_HUMAN_APPROVAL` | Dashboard evidence that leaked password protection is enabled for production | Screenshot or exported audit note with project ref, date, owner, and secrets redacted | Supabase production Auth settings show leaked password protection enabled, or a documented security exception is approved |
| Production SQL backup | `BLOCKED_HUMAN_APPROVAL` | Real production backup evidence | Backup id/snapshot id, timestamp UTC, owner, storage location class, restore availability | Backup exists, is restorable, and is stored outside repo |
| Production revert/restore drill | `BLOCKED_HUMAN_APPROVAL` | Restore or rollback drill evidence | Drill record with commands, timestamp, result, owner, and rollback time estimate | Revert plan has been tested or production owner accepts documented fallback |
| Vercel Production envs | `BLOCKED_EXTERNAL_CREDENTIALS` | Secure verification of real Production env names and values | Redacted env inventory and owner attestation | Required envs exist in Production, values are non-placeholder, and no private secrets are public |
| PayPal live | `BLOCKED_EXTERNAL_CREDENTIALS` | Live app credentials, products/plans, webhook id, and controlled live event evidence | PayPal live app id, webhook id, event delivery 2xx, signature verification success, controlled subscription result | PayPal live subscription flow and webhook signature validation are proven in production release window |
| Google OAuth production | `BLOCKED_EXTERNAL_CREDENTIALS` | Production OAuth client and redirect URI verification | Google Cloud OAuth client id, redirect URI list, Supabase provider setting, login smoke result; all secrets redacted | Login/signup works against production domain with exact redirect URIs |
| Human production approval | `BLOCKED_HUMAN_APPROVAL` | Explicit release approval and deploy window | Written approval with owner, date, rollback owner, comms owner, and deploy window | Approval exists and all technical blockers are `READY` |

## Safe Commands Already Allowed

These commands are safe because they do not deploy or mutate production:

```powershell
git status -sb
npm run lint
npm run typecheck
npm run test
npm run build
npm run staging:check
npm run production:check
npm run test:rls
```

## Commands Still Prohibited

Do not run these until every blocker is `READY` and explicit production approval exists:

```powershell
npx vercel deploy --prod
npx vercel promote
vercel env add <name> production
vercel env rm <name> production
supabase db push --linked
psql <production-db-url> -f <migration.sql>
```

## Human Closeout Order

1. Verify Supabase Auth leaked password protection in the production dashboard.
2. Create and record production backup evidence.
3. Prove revert/restore path or record accepted fallback.
4. Verify Vercel Production envs without printing values.
5. Configure and verify PayPal live credentials, product, plans, webhook, and controlled subscription.
6. Configure and verify Google OAuth production redirects.
7. Re-run all repo checks.
8. Produce explicit release approval.

## Final Gate Rule

Production remains `NO-GO_PRODUCTION` until every blocker is `READY`.
