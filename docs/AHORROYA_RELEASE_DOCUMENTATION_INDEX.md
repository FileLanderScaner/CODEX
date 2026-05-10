# AhorroYA Release Documentation Index

Fecha: 2026-05-10

## Estado canonico actual

- `STAGING_STATUS=APPROVED`
- `PREPRODUCTION_STATUS=APPROVED`
- `PRODUCTION_STATUS=NO-GO_PRODUCTION`
- `CODEX_AUTO_APPROVAL_GATE=PASS_PREPROD`
- Supabase RLS: `PASS` via Session Pooler
- PayPal: sandbox solamente
- AI Gateway: deshabilitado
- Agentes IA: deshabilitados
- Vercel Preview: Ready y protegido por Deployment Protection

## Regla de precedencia documental

Si dos documentos se contradicen, usar este orden de autoridad:

1. `docs/production-gate-status.json`
2. `docs/ahorroya-autonomous-status.json`
3. `docs/AHORROYA_CODEX_AUTO_RELEASE_GATE_2026-05-10.md`
4. `docs/AHORROYA_AUTONOMOUS_PROJECT_STATUS.md`
5. Este indice
6. Runbooks actuales de `docs/deployment/` y `docs/security/`
7. Reportes historicos fechados

Los reportes historicos fechados se conservan como evidencia de auditoria. No deben usarse para decidir go/no-go actual si contienen estados antiguos como `demo_or_partial`, `BLOCKED_LOCAL_PSQL`, `BLOCKED_SUPABASE_SCHEMA`, URLs preview previas o conteos antiguos de tests.

## Documentos canonicos para release

| Documento | Uso |
|---|---|
| `docs/production-gate-status.json` | Estado machine-readable del gate de produccion |
| `docs/ahorroya-autonomous-status.json` | Estado machine-readable de ciclos autonomos |
| `docs/AHORROYA_CODEX_AUTO_RELEASE_GATE_2026-05-10.md` | Evidencia del gate automatico Codex |
| `docs/AHORROYA_AUTONOMOUS_PROJECT_STATUS.md` | Estado global humano de ciclos autonomos |
| `docs/PRODUCTION_GO_NO_GO.md` | Politica go/no-go de produccion |
| `docs/PRODUCTION_READINESS.md` | Readiness productivo y faltantes |
| `docs/AHORROYA_PRODUCTION_DEPLOY_PLAN_2026-05-08.md` | Plan de deploy productivo, aun bloqueado |
| `docs/deployment/production-backup-sql-plan.md` | Plan de backup SQL antes de produccion |
| `docs/deployment/production-revert-sql-plan.md` | Plan de revert SQL |
| `docs/security/supabase-auth-production-gate.md` | Gate de Supabase Auth production |
| `docs/security/roles-and-rls.md` | Modelo de roles y RLS |
| `docs/AHORROYA_PAYPAL_STAGING_SETUP_2026-05-08.md` | Setup PayPal sandbox/staging |
| `docs/PAYPAL_SANDBOX_RUNBOOK.md` | Runbook operacional PayPal sandbox |

## Documentos historicos que requieren contexto

Estos documentos pueden contener estados ya superados. Son utiles para trazabilidad, no para decidir el estado actual:

| Documento | Estado historico observado |
|---|---|
| `docs/AHORROYA_CURRENT_DEVELOPMENT_STATUS_2026-05-08.md` | Menciona `DEMO_OR_PARTIAL`, 68 tests y staging no listo |
| `docs/AHORROYA_STAGING_READINESS_AUDIT_2026-05-08.md` | Menciona staging no listo y RLS no validado |
| `docs/AHORROYA_ENV_RESOLUTION_REPORT_2026-05-08.md` | Incluye URLs preview antiguas y conteos antiguos |
| `docs/STAGING_RELEASE_CANDIDATE_REPORT.md` | Refleja un estado previo de readiness |
| `docs/FASE_*.md` | Reportes por fase con estados intermedios |
| `docs/HANDOFF_PARA_CHATGPT.md` | Bitacora extensa con estados acumulados |
| `docs/VERCEL_AUTONOMY_AUDIT.md` | Auditoria historica con resultados intermedios |

## Bloqueos productivos vigentes

Produccion permanece bloqueada hasta contar con evidencia externa de:

- Supabase Auth leaked password protection activa en production.
- Backup SQL production real generado y validado.
- Revert/restore drill production real validado.
- Vercel Production env completo y verificado.
- PayPal live completo y validado.
- Google OAuth production completo y validado.
- Plan de dependencia segura para findings moderados Expo/PostCSS.

## Confirmaciones de seguridad

- No usar `vercel --prod`.
- No ejecutar `vercel promote`.
- No modificar Vercel Production env sin gate productivo completo.
- No aplicar migraciones production.
- No activar PayPal live sin credenciales reales y prueba controlada.
- No activar AI Gateway ni agentes IA autonomos.
- No commitear `.env`, `.env.local`, `.env.rls`, tokens ni credenciales.
