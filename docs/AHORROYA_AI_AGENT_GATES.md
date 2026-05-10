# AhorroYA AI Agent Gates

Date: 2026-05-10

## Default Gate

```text
AI_AGENTS_STATUS=DISABLED_BY_DEFAULT
PRODUCTION_AGENT_STATUS=DISABLED
```

Agents may be enabled only in local or staging after all required gates pass.

## Gate Matrix

| Gate | Local | Staging | Production |
| --- | --- | --- | --- |
| `AI_PROVIDER=mock` | Required by default | Required by default | Required |
| `AI_GATEWAY_ENABLED=false` | Required unless smoke testing | Required unless explicit smoke gate | Required |
| `ENABLE_ADMIN_AI_PANEL=false` | Default | Default, can be temporarily enabled | Required |
| `ENABLE_AI_AGENTS=false` | Default | Default, can be temporarily enabled | Required |
| `ENABLE_AGENT_SCHEDULER=false` | Default | Default | Required |
| `ENABLE_AI_LEVEL4_OVERRIDE=false` | Required | Required | Required |
| `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY` | Default | Required default | Required |
| `AI_KILL_SWITCH=true` | Emergency block | Emergency block | Emergency block |

## Staging Enablement Gate

Temporary staging enablement requires:

1. `APP_ENV=preview` or `APP_ENV=local`.
2. `ENABLE_ADMIN_AI_PANEL=true`.
3. Caller JWT has `app_metadata.role=admin` or `internal_job`.
4. `ENABLE_AI_AGENTS=true` only for `run` or `runAllSafe`.
5. `AI_AUTONOMY_LEVEL` is no higher than `LEVEL_0_READ_ONLY` unless a separate staging-only review approves higher dry-run mode.
6. `dryRun=true`.
7. RLS smoke passes.
8. Secret scan passes.

## Production Gate

Production agent execution remains blocked by code. Do not enable agents in production until a future release explicitly changes the policy.

Required before any future production agent mode:

- Separate production architecture review.
- Dedicated service identity with scoped permissions.
- Verified audit logs.
- Alerting on blocked actions.
- Read-only mode first.
- Explicit rollback plan.
- No direct write access to payments, envs, deploys, user PII, or RLS policies.

## Blocked Actions

Agents must never execute:

- `delete_production_data`
- `modify_credentials`
- `touch_real_payments`
- `send_bulk_external_messages`
- `publish_external_content`
- `manual_price_override_without_source`
- `manipulate_user_data_without_audit`
- `execute_untrusted_remote_code`

High and critical risk suggestions require external review and must remain suggestions, not applied actions.

## Required Checks

Before enabling any staging agent run:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run staging:check
npm run production:check
npm run test:rls
```

Expected RLS evidence:

- `normal_blocked: true`
- `admin_allowed: true`
- `internal_job_allowed: true`
- `rls_validation: PASS`

## Incident Kill Switch

Set:

```text
AI_KILL_SWITCH=true
```

Expected API response:

```text
ai_agents_kill_switch_active
```

Then:

1. Keep `ENABLE_AI_AGENTS=false`.
2. Keep `ENABLE_ADMIN_AI_PANEL=false`.
3. Preserve logs.
4. Review `agent_logs`, `agent_executions`, and `agent_suggestions`.
5. Do not delete audit records.
