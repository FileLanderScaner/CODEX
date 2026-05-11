# AhorroYA Production Backup And Revert Evidence Template

Date: 2026-05-11

## Status

```text
PRODUCTION_BACKUP_STATUS=BLOCKED_HUMAN_APPROVAL
PRODUCTION_REVERT_STATUS=BLOCKED_HUMAN_APPROVAL
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Backup Evidence Template

Fill this outside the repo or commit only with secrets redacted:

```text
Backup id or snapshot id:
Provider:
Production project ref:
Created at UTC:
Created by:
Scope:
Storage location class:
Retention window:
Restore availability confirmed: yes/no
Secrets printed in logs: no
Evidence location:
Approver:
```

## Revert / Restore Drill Evidence Template

```text
Drill id:
Environment used for drill:
Backup/snapshot used:
Started at UTC:
Completed at UTC:
Executed by:
Validated by:
Objects restored or reverted:
App deployment rollback path:
Env/config rollback path:
SQL rollback path:
Data loss risk:
Observed restore duration:
Post-restore checks:
Decision:
```

## Safe Commands For Human Operator

These are examples only. Do not run them from Codex against production without explicit production authorization.

Backup example:

```powershell
pg_dump --format=custom --no-owner --no-acl --file <secure-backup-path> <PRODUCTION_DB_URL>
```

Backup integrity list example:

```powershell
pg_restore --list <secure-backup-path>
```

Schema verification after restore:

```powershell
psql <RESTORED_DB_URL> -f scripts/sql/verify-production-schema.sql
```

Rules:

- Never print `<PRODUCTION_DB_URL>`.
- Store backups outside the repo.
- Encrypt backups if stored outside Supabase managed backups.
- Validate restore before approving production changes.

## Risk If Omitted

- Data loss cannot be recovered predictably.
- Failed migrations can become irreversible.
- Release rollback depends on improvisation.
- Production approval lacks evidence.

## Ready Condition

Set backup and revert to `READY` only when a production backup exists, restore/revert evidence exists, and the responsible owner signs off before deployment.
