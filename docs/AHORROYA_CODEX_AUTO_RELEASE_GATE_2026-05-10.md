# AhorroYA Codex auto release gate - 2026-05-10

## Decision

`CODEX_AUTO_APPROVAL_GATE=PASS_PREPROD`

`PRODUCTION_STATUS=NO-GO_PRODUCTION`

Codex reemplazo la aprobacion humana manual por un gate automatico basado en evidencia verificable. El resultado permite mantener preproduccion aprobada, pero no permite produccion porque faltan evidencias externas reales de production.

## Rama y commits

- Rama: `codex/preprod-hardening-auth-paypal`.
- Commit inicial: `53b07229ace62d4e83b5f46580897bed737e13fc`.
- Commit final: commit que contiene este reporte; hash exacto en el reporte final de Codex.
- Remoto: `AhorroYa/codex/preprod-hardening-auth-paypal`.
- Estado Git pre-gate: limpio y sincronizado.

## Checks ejecutados

| Check | Resultado | Evidencia |
|---|---:|---|
| `git status -sb` | PASS | Rama limpia y sincronizada antes del gate |
| `git rev-list --left-right --count @{u}...HEAD` | PASS | `0 0` |
| `.gitignore` | PASS | `.env`, `.env.*`, `.env.local`, `.env.rls`, `.vercel`, `secrets/` ignorados; ejemplos permitidos |
| tracked env files | PASS | No hay `.env`, `.env.local`, `.env.rls`, `.env.server.local`, `.env.vercel.local` ni backup local tracked |
| secret scan amplio | REVIEWED | Marco falsos positivos en ejemplos/tests/codigo; no se imprimieron valores |
| secret scan clasificado | PASS | Sospechosos clasificados como placeholders o fixtures de test |
| `npm ci` | PASS_WITH_WARNINGS | Instalacion reproducible OK; audit inicial detecto 1 high + 4 moderate |
| `npm audit fix` | PASS | Corrigio `fast-xml-builder` transitivo de `1.1.5` a `1.2.0` |
| `npm audit --audit-level=high` | PASS | Sin vulnerabilidades high/critical restantes |
| `npm run lint` | PASS | `basic lint passed` |
| `npm run typecheck` | PASS | `syntax check passed (138 files)` |
| `npm run test` | PASS | 24 test files, 89 tests |
| `npm run build` | PASS | Expo web export OK |
| `npm run staging:check` | PASS | `mode=staging_ready` |
| `npm run production:check` | PASS tecnico | `mode=staging_ready`; no equivale a production ready |
| `npm run test:rls` | PASS | `RLS_SESSION_POOLER_DETECTED`, `rls_validation: PASS` |
| Vercel Preview inspect | PASS | Branch preprod alias resuelve a deployment `Ready`, target `preview` |
| Vercel public HTTP | PASS | Branch alias devuelve 401 publico, consistente con Deployment Protection |

## Seguridad de dependencias

`npm audit fix` aplico una correccion no forzada al lockfile:

- `fast-xml-builder`: `1.1.5` -> `1.2.0`.
- La vulnerabilidad alta transitiva quedo resuelta.

Quedan 4 vulnerabilidades moderadas en la cadena Expo/PostCSS. `npm audit` indica que la correccion disponible requiere `npm audit fix --force` y cambiaria a `expo@49.0.23`, lo que es un cambio mayor/regresivo frente a Expo 53. No se aplico por seguridad de release. Debe tratarse como item de hardening de dependencias antes de production.

## Supabase y RLS

Estado:

- RLS: PASS.
- Session Pooler: PASS.
- `normal_blocked: true`.
- `admin_allowed: true`.
- `internal_job_allowed: true`.
- `rls_validation: PASS`.

No se tocaron bases production. No se aplico SQL remoto. No se ejecuto SQL destructivo. Los planes de backup y revert existen como runbooks, pero no hay backup production real tomado ni restore drill verificado.

Supabase Auth leaked password protection:

- Documentado en `docs/security/supabase-auth-production-gate.md`.
- Segun documentacion oficial de Supabase, leaked password protection usa HaveIBeenPwned Pwned Passwords.
- No hay evidencia verificable desde el repo de que el toggle este activo en production.
- Bloquea production hasta evidencia externa.

## Vercel

Preview:

- Alias preprod: `https://codex-git-codex-preprod-hardening-auth-paypal-akuma424-projects.vercel.app`.
- Deployment resuelto: `https://codex-df2hjuw1k-akuma424-projects.vercel.app`.
- Target: `preview`.
- Status: `Ready`.
- HTTP publico: 401 por Deployment Protection.

Production:

- Proyecto Vercel existe y tiene URL production visible por nombre.
- `vercel env ls` confirmo que existen environment variables, pero esta CLI no imprimio nombres/valores en formato util.
- No se verificaron valores production reales.
- No se modifico Vercel Production env.
- No se uso `--prod`.
- No se ejecuto `vercel promote`.

Resultado: `vercel_production_env_ready=false`.

## PayPal

Sandbox:

- Estado: `PAYPAL_SANDBOX_READY`.
- Webhook sandbox documentado con branch alias y bypass redaccionado:
  `https://codex-git-codex-production-deploy-ready-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>`.
- Eventos sandbox esperados documentados.
- No se ejecutaron pagos reales.

Live:

- No se activaron credenciales live.
- No hay evidencia verificable de `PAYPAL_CLIENT_ID` live, `PAYPAL_CLIENT_SECRET` live, `PAYPAL_WEBHOOK_ID` live, webhook URL production live, firma live ni suscripcion live controlada.

Resultado: `paypal_live_ready=false`.

## Google OAuth

Staging/local checks estan en `staging_ready`, pero production no esta verificada:

- No hay evidencia de OAuth client production real.
- No hay evidencia de redirect URIs production reales validadas.
- No se inventaron credenciales.

Resultado: `google_oauth_production_ready=false`.

## AI Gateway y agentes IA

Estado:

- `AI_GATEWAY_ENABLED=false`.
- `ENABLE_AI_AGENTS=false`.
- `AI_PROVIDER=mock`.
- No se hicieron llamadas pagas a AI.
- No se activaron agentes IA autonomos.

Resultado: `ai_agents_disabled=true`.

## Archivos modificados

- `package-lock.json`.
- `docs/AHORROYA_CODEX_AUTO_RELEASE_GATE_2026-05-10.md`.
- `docs/production-gate-status.json`.

## Bloqueos para production

1. Falta evidencia de Supabase Auth leaked password protection activo en production o excepcion de riesgo aprobada.
2. Falta backup SQL production real, verificable y restaurable.
3. Falta revert/restore drill production aprobado con evidencia.
4. Falta verificar Vercel Production env real por nombres y valores esperados sin exponer secretos.
5. Falta configurar/verificar PayPal live completo.
6. Falta configurar/verificar Google OAuth production completo.
7. Quedan vulnerabilidades moderadas Expo/PostCSS que requieren plan de actualizacion seguro.
8. Falta ventana production formal y criterios operativos de rollback ejecutados.

## Proximas acciones tecnicas

1. Completar evidencia externa de Supabase Auth leaked password protection.
2. Tomar backup production desde Supabase Dashboard y registrar identificador fuera del repo.
3. Ejecutar restore drill o validacion de restaurabilidad en entorno seguro.
4. Verificar Vercel Production env con mecanismo que liste nombres sin valores y checklist offline de valores.
5. Preparar PayPal live en Dashboard sin activar flujo hasta el gate.
6. Preparar Google OAuth production y validar redirect URIs.
7. Planificar actualizacion Expo/PostCSS sin `npm audit fix --force` directo sobre release.

## Confirmaciones

- No se imprimieron secretos.
- No se commiteo `.env`.
- No se uso `--prod`.
- No se ejecuto `vercel promote`.
- No se tocaron envs Production salvo verificacion segura de solo lectura.
- PayPal live no se activo.
- AI Gateway y agentes IA siguen apagados.
- `PRODUCTION_STATUS=NO-GO_PRODUCTION`.
