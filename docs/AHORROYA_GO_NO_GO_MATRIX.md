# AhorroYA Go/No-Go Matrix

Fecha: 2026-05-10

## Matriz

| Gate | Staging | Production | Evidencia |
|---|---|---|---|
| Git limpio | GO | GO | `git status -sb` |
| Secret scan | GO | GO | `secret-scan:ok` |
| npm audit | GO | GO | `found 0 vulnerabilities` |
| Lint | GO | GO | `basic lint passed` |
| Typecheck | GO | GO | `syntax check passed (139 files)` |
| Tests | GO | GO | 25 files, 95 tests |
| Build | GO | GO | Expo export OK |
| Staging check | GO | N/A | `mode=staging_ready` |
| Production check seguro | INFO | NO-GO | `mode=staging_ready`, no `production_ready` |
| RLS | GO | NO-GO | Staging/local PASS; production not independently verified |
| Supabase Auth leaked password protection | INFO | NO-GO | Dashboard evidence missing |
| Backup SQL real | INFO | NO-GO | Plan exists, no real backup evidence |
| Revert drill real | INFO | NO-GO | Plan exists, no drill evidence |
| Vercel Preview | GO | N/A | Preview readiness previously validated |
| Vercel Production env | N/A | NO-GO | Not verified |
| PayPal sandbox | GO | N/A | Sandbox flow documented/tested |
| PayPal live | N/A | NO-GO | Live credentials/webhook/test missing |
| Google OAuth staging | GO | N/A | Staging check ready |
| Google OAuth production | N/A | NO-GO | Production client/secret/redirects not verified |
| AI Gateway | GO | GO | Disabled by default |
| AI agents | GO | GO | Disabled/protected by flags and roles |
| B2B endpoints | GO | GO | Fixed with admin/internal_job role checks |
| Readiness endpoint | GO | GO | Fixed to distinguish sandbox/public-only from production |
| E2E browser complete flow | INFO | NO-GO | Only minimal E2E exists |

## Decision

### Staging

`GO_STAGING`

Motivo: checks tecnicos PASS, RLS PASS, PayPal sandbox, AI apagada, B2B/readiness fixes aplicados.

### Production

`NO_GO_PRODUCTION`

Motivo: faltan credenciales/evidencias externas production y E2E completo. No usar `vercel --prod`, no ejecutar `vercel promote`, no tocar envs Production y no activar PayPal live hasta cerrar gates.

## Comandos prohibidos hasta GO production

- `vercel --prod`
- `npx vercel --prod`
- `vercel promote`
- migraciones production
- SQL destructivo
- PayPal live charges
- activacion de AI agents autonomos
