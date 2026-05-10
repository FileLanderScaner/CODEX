# AhorroYA Production Audit Report

Fecha: 2026-05-10
Rama: `codex/preprod-hardening-auth-paypal`
Commit auditado inicialmente: `e1be50567566824c6cffb82739a68bfc198442ad`

## Veredicto

- Staging/preproduccion: `GO_STAGING`
- Produccion: `NO_GO_PRODUCTION`

Produccion no esta lista. El proyecto pasa checks tecnicos locales/staging, pero faltan evidencias externas y habia dos superficies corregibles dentro del repo durante esta auditoria.

## Checks ejecutados

| Check | Resultado | Evidencia |
|---|---|---|
| `git status -sb` | PASS | Rama limpia al inicio |
| Secret scan tracked files | PASS | `secret-scan:ok` |
| `npm audit` | PASS | `found 0 vulnerabilities` |
| `npm run lint` | PASS | `basic lint passed` |
| `npm run typecheck` | PASS | `syntax check passed (139 files)` |
| `npm run test` | PASS | 25 files, 95 tests despues de fixes |
| `npm run build` | PASS | Expo web export completado |
| `npm run staging:check` | PASS | `mode=staging_ready` |
| `npm run production:check` | PASS tecnico | `mode=staging_ready`; no es production ready |
| `npm run test:rls` | PASS | `RLS_SESSION_POOLER_DETECTED`, `rls_validation: PASS` |

## Hallazgos

### CRITICAL-001 - Produccion no tiene gate completo ni evidencias externas

1. Descripcion: El sistema no puede declararse production-ready porque faltan credenciales y evidencias externas reales.
2. Evidencia: `docs/production-gate-status.json` marca `vercel_production_env_ready=false`, `paypal_live_ready=false`, `google_oauth_production_ready=false`, `supabase_auth_leaked_password_protection_verified=false`, `supabase_backup_ready=false`, `supabase_revert_ready=false`.
3. Archivo afectado: `docs/production-gate-status.json`.
4. Riesgo real: Deploy productivo con pagos/auth/backups incompletos; riesgo de login roto, cobro fallido, perdida de datos o imposibilidad de revertir.
5. Como corregirlo: Configurar y verificar Vercel Production env, PayPal live, Google OAuth production, Supabase Auth leaked password protection, backup real y restore/revert drill.
6. Correccion ahora: No posible desde repo sin credenciales/dashboards production.
7. Bloqueo: `BLOCKED_EXTERNAL_CREDENTIALS`.

### HIGH-001 - Endpoint B2B exponia datos agregados sin rol admin

1. Descripcion: `/api/v1/b2b/dashboard` y `/api/v1/b2b/export.csv` estaban registrados en el router y leian eventos/comercial data sin `requireRole`.
2. Evidencia: `api/[...path].js` registra `v1/b2b/dashboard` y `v1/b2b/export.csv`; antes de la auditoria `server/api/v1/monetization.js` no exigia rol.
3. Archivo afectado: `server/api/v1/monetization.js`.
4. Riesgo real: Exposicion de demanda, clicks, leads y datos comerciales agregados a usuarios no autorizados.
5. Como corregirlo: Exigir `admin` o `internal_job` antes de consultar/exportar datos B2B.
6. Correccion ahora: Corregido. `b2bDashboard` y `b2bExportCsv` usan `requireRole(req, ['admin', 'internal_job'])`.
7. Validacion: `tests/integration/b2b-endpoints.test.js` cubre anónimo 401, usuario comun 403 y admin 200.

### HIGH-002 - Readiness API podia sugerir produccion sin PayPal live ni Google OAuth server

1. Descripcion: `/api/v1/readiness` calculaba modo production con Supabase, PayPal credentials y origins, pero no exigia `PAYPAL_ENV=live` ni `GOOGLE_OAUTH_CLIENT_SECRET`.
2. Evidencia: `server/api/v1/readiness.js` usaba `productionReady = hasSupabase && hasSupabasePublic && hasPayPal && hasAllowedOrigins`.
3. Archivo afectado: `server/api/v1/readiness.js`.
4. Riesgo real: Operadores o monitores podrian interpretar falsamente que production esta lista con credenciales sandbox o Google public-only.
5. Como corregirlo: Exigir PayPal live y Google OAuth server-side para modo production.
6. Correccion ahora: Corregido. Readiness distingue `sandbox_only`, `public_only`, `live_ready` y `server_ready`.
7. Validacion: `tests/integration/readiness.test.js` prueba sandbox/public-only como degradado y live/server OAuth como production.

### HIGH-003 - PayPal live no esta verificado

1. Descripcion: PayPal sigue en sandbox; no hay evidencia de client id/secret live, webhook live, plan ids live o prueba live controlada.
2. Evidencia: `docs/AHORROYA_MONETIZATION_PLAN.md` declara `MONETIZATION_STATUS=SANDBOX_READY_LIVE_BLOCKED`; `docs/production-gate-status.json` declara `paypal_live_ready=false`.
3. Archivo afectado: `docs/AHORROYA_MONETIZATION_PLAN.md`.
4. Riesgo real: Cobros reales fallan o quedan sin webhook/firma; usuarios pueden pagar sin activar Premium o activar sin registro consistente.
5. Como corregirlo: Configurar PayPal live, webhook production, plan ids y prueba controlada con firma validada.
6. Correccion ahora: No posible sin credenciales PayPal live.
7. Bloqueo: `BLOCKED_REQUIRES_REAL_PAYMENT_PROVIDER_ACTION`.

### HIGH-004 - Google OAuth production no esta verificado

1. Descripcion: No hay evidencia de OAuth client production, redirect URIs production ni secreto server-side production.
2. Evidencia: `docs/production-gate-status.json` marca `google_oauth_production_ready=false`; `docs/PRODUCTION_READINESS.md` exige `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`.
3. Archivo afectado: `docs/PRODUCTION_READINESS.md`.
4. Riesgo real: Login/signup puede fallar en dominio production; usuarios no podrian asociar Premium a cuenta real.
5. Como corregirlo: Configurar OAuth production en Google/Supabase con redirects exactos y validar login.
6. Correccion ahora: No posible sin consola OAuth/dominio production.
7. Bloqueo: `BLOCKED_REQUIRES_REAL_DNS_OR_OAUTH_CONSOLE_ACTION`.

### HIGH-005 - Backup/revert production real no ejecutado

1. Descripcion: Hay runbooks, pero no evidencia de backup production real ni restore/revert drill.
2. Evidencia: `docs/deployment/production-backup-sql-plan.md` y `docs/deployment/production-revert-sql-plan.md` son planes; `docs/production-gate-status.json` marca `supabase_backup_ready=false` y `supabase_revert_ready=false`.
3. Archivo afectado: `docs/deployment/production-backup-sql-plan.md`.
4. Riesgo real: Ante migracion o deploy fallido no hay punto de restauracion probado.
5. Como corregirlo: Tomar backup production verificable, registrar evidencia fuera del repo y ejecutar restore/revert drill.
6. Correccion ahora: No posible sin acceso/ventana production.
7. Bloqueo: `BLOCKED_DESTRUCTIVE_ACTION_REQUIRED` para cualquier migracion production.

### MEDIUM-001 - Rate limit production puede quedar en memoria si falta Upstash

1. Descripcion: `ENABLE_LOCAL_FALLBACK` default true permite rate limiting en memoria si falta Redis/Upstash.
2. Evidencia: `lib/env.js` default `ENABLE_LOCAL_FALLBACK=true`; `server/api/_security.js` usa memory fallback si no hay Upstash y fallback esta habilitado.
3. Archivo afectado: `server/api/_security.js`.
4. Riesgo real: En serverless/multiproceso el limitador en memoria no es global; abuso puede saltar limites.
5. Como corregirlo: Para production, exigir Upstash o equivalente y `ENABLE_LOCAL_FALLBACK=false`.
6. Correccion ahora: No posible sin proveedor/config production; documentado como bloqueante antes de production.
7. Bloqueo: `BLOCKED_EXTERNAL_CREDENTIALS`.

### MEDIUM-002 - Supabase Auth leaked password protection no verificado

1. Descripcion: El gate esta documentado, pero no hay evidencia de Dashboard production.
2. Evidencia: `docs/security/supabase-auth-production-gate.md` declara `SUPABASE_AUTH_LEAKED_PASSWORD_PROTECTION=MANUAL_BLOCKER`.
3. Archivo afectado: `docs/security/supabase-auth-production-gate.md`.
4. Riesgo real: Usuarios podrian registrarse con passwords filtradas si el toggle no esta activo.
5. Como corregirlo: Verificar/activar en Supabase Dashboard y registrar evidencia sin secretos.
6. Correccion ahora: No posible desde repo.
7. Bloqueo: `BLOCKED_MISSING_ACCESS`.

### MEDIUM-003 - Cobertura E2E browser insuficiente para release production

1. Descripcion: Existe E2E basico de busqueda, pero falta flujo completo home -> search -> result -> detail -> favorite -> alert -> premium sandbox.
2. Evidencia: `tests/e2e/search.spec.js` cubre solo render y busqueda fallback.
3. Archivo afectado: `tests/e2e/search.spec.js`.
4. Riesgo real: UX critica puede romperse sin que unit/integration lo detecten.
5. Como corregirlo: Agregar Playwright end-to-end completo en Preview/localhost con estados autenticados controlados.
6. Correccion ahora: No aplicada en esta auditoria porque requiere estrategia de fixtures/auth visual; queda como backlog antes de production.
7. Bloqueo: No bloquea staging; bloquea production UX confidence.

### LOW-001 - Documentacion historica conserva estados obsoletos

1. Descripcion: Hay documentos historicos con `demo_or_partial`, conteos antiguos y URLs previas.
2. Evidencia: `docs/AHORROYA_RELEASE_DOCUMENTATION_INDEX.md` clasifica esos documentos como historicos.
3. Archivo afectado: `docs/AHORROYA_RELEASE_DOCUMENTATION_INDEX.md`.
4. Riesgo real: Lectores podrian tomar un reporte viejo como estado actual.
5. Como corregirlo: Mantener indice canonico y agregar banners si el equipo usa esos documentos frecuentemente.
6. Correccion ahora: Ya existe indice canonico; no requiere cambio adicional.
7. Bloqueo: Ninguno.

## Revision por area

| Area | Resultado |
|---|---|
| Secrets | PASS, sin secretos reales detectados en tracked files |
| Supabase/RLS | PASS staging/local; production Dashboard/Auth/backup no verificados |
| PayPal | Sandbox listo; live bloqueado |
| Google OAuth | Staging/config local suficiente; production bloqueado |
| Vercel | Preview/config OK; Production env no verificado |
| AI agents | Defaults seguros; endpoints protegidos y agentes apagados |
| Build/tests | PASS |
| UX | Staging usable; E2E production insuficiente |

## Decision final

`GO_STAGING`

`NO_GO_PRODUCTION`
