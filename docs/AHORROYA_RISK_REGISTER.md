# AhorroYA Risk Register

Fecha: 2026-05-10

| ID | Severidad | Riesgo | Estado | Mitigacion | Owner |
|---|---|---|---|---|---|
| R-001 | CRITICAL | Production env/credentials no verificadas | OPEN | Completar Vercel Production env, PayPal live, OAuth production | Release Manager |
| R-002 | HIGH | PayPal live no validado | OPEN | Configurar live, webhook, plan ids y prueba controlada | Payments |
| R-003 | HIGH | Google OAuth production no validado | OPEN | Configurar client/secret/redirects production | Auth |
| R-004 | HIGH | Backup/revert production real no ejecutado | OPEN | Tomar backup y ejecutar drill | Database |
| R-005 | HIGH | B2B dashboard/export sin auth | FIXED | `requireRole(admin/internal_job)` y tests | Security |
| R-006 | HIGH | Readiness API podia sobredeclarar production | FIXED | Exigir PayPal live + OAuth server | DevOps |
| R-007 | MEDIUM | Rate limit production puede usar memory fallback | OPEN | Upstash requerido y fallback off en production | Platform |
| R-008 | MEDIUM | Supabase leaked password protection no verificado | OPEN | Verificar Dashboard | Security |
| R-009 | MEDIUM | E2E browser insuficiente | OPEN | Ampliar Playwright con flujo completo | QA |
| R-010 | LOW | Docs historicas pueden confundir | MITIGATED | Indice canonico de docs | Release |

## Riesgos corregidos en esta auditoria

### R-005

- Archivos: `server/api/v1/monetization.js`, `tests/integration/b2b-endpoints.test.js`
- Validacion: tests focalizados PASS y suite completa PASS.

### R-006

- Archivos: `server/api/v1/readiness.js`, `tests/integration/readiness.test.js`
- Validacion: tests focalizados PASS y suite completa PASS.

## Riesgos que bloquean produccion

- R-001
- R-002
- R-003
- R-004
- R-007
- R-008
- R-009

Mientras cualquier riesgo production bloqueante siga abierto:

`PRODUCTION_STATUS=NO-GO_PRODUCTION`
