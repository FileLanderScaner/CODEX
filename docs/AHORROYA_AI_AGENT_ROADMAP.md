# AhorroYA AI Agent Roadmap

Date: 2026-05-10

## Current State

AhorroYA has a safe foundation for AI agents, but agents remain disabled by default and disabled in production.

Implemented foundations:

- Agent registry and orchestrator.
- Permission levels.
- Blocked action list.
- Supabase-backed memory with sanitization.
- RLS-protected agent tables.
- Admin/internal job role model.
- Tests for disabled defaults, role checks, kill switch, and production block.

## Phase 0 - Disabled Safe Baseline

Status: complete.

Goals:

- Keep agents off.
- Keep AI provider as `mock`.
- Keep production disabled.
- Validate RLS and secret safety.

Exit criteria:

- `npm run test:rls` passes.
- `AI_KILL_SWITCH` test passes.
- No production action is possible.

## Phase 1 - Staging Read-Only Reports

Goal:

- Allow admin/internal_job in staging to run read-only reports with `dryRun=true`.

Candidate agents:

- `ProductAuditAgent`
- `QARegressionAgent`
- `SecurityComplianceAgent`
- `ObservabilityAgent`
- `MonetizationAgent`

Outputs:

- `agent_reports`
- `agent_suggestions`
- `agent_logs`

No code writes, deploys, payment changes, env changes, or database mutations except audit tables.

## Phase 2 - Staging Task Creation

Goal:

- Let agents create `agent_tasks` and `agent_suggestions` for roadmap and QA triage.

Constraints:

- Suggestions stay `pending` or `proposed`.
- High/critical risk suggestions stay blocked.
- No auto-apply.

## Phase 3 - Assisted Engineering Proposals

Goal:

- Generate implementation proposals, test plans, and pull request checklists.

Constraints:

- No direct production deploy.
- No production env modification.
- No PayPal live activation.
- No SQL execution against production.

## Phase 4 - Controlled Automation Review

Goal:

- Evaluate whether limited automation is safe in staging.

Required before starting:

- Strong audit evidence.
- Dedicated staging service identity.
- Alerting on blocked actions.
- Runbook for `AI_KILL_SWITCH=true`.

Production remains disabled.

## Phase 5 - Future Production Read-Only Mode

Goal:

- Consider production read-only observability only.

This phase is not approved. It requires a new security review and code changes to replace the current production endpoint block with a narrowly scoped read-only path.

## Business Use Cases

Highest-value safe agent outputs:

- Weekly monetization report.
- PayPal webhook anomaly report.
- RLS drift report.
- Conversion funnel report.
- Search zero-results report.
- Price data freshness report.
- Premium churn and cancellation report.
- Production readiness gap report.

## Non-Negotiables

- Agents do not activate payments.
- Agents do not modify production env.
- Agents do not deploy production.
- Agents do not delete data.
- Agents do not disable RLS.
- Agents do not print secrets.
- Agents do not auto-approve critical changes.
