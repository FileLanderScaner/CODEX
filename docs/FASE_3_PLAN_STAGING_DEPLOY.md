# Fase 3 - Plan staging deploy

## Estado inicial

- Rama: `codex/production-deploy-ready`.
- Validacion inicial ejecutada: `git status`, lint, typecheck, tests, build, production check y E2E.
- Resultado inicial: app verde localmente; `production:check` sigue `demo_or_partial`.
- Hay cambios sin staged de fases previas y `web-out.log` modificado como artefacto generado.

## Ya esta correcto

- Arquitectura IA modular y sin duplicacion.
- Endpoint `/api/v1/ai/agents` protegido por flags, auth y rol.
- `SupabaseAgentMemory` con fallback in-memory seguro.
- Migracion de memoria IA con RLS para `admin` e `internal_job`.
- Build, tests y E2E pasan localmente.
- Produccion sigue bloqueada por flags.

## Falta para staging

- Configurar variables reales en Vercel preview/staging.
- Aplicar migraciones en Supabase staging.
- Validar RLS con usuarios reales `admin` e `internal_job`.
- Configurar PayPal sandbox y webhook.
- Configurar Google Auth con redirect de staging.
- Probar `/admin/ai-agents` con auth real.
- Ejecutar smoke tests contra deployment preview.

## Falta para produccion

- Repetir validaciones en entorno productivo.
- Configurar `PAYPAL_ENV=live` solo luego de sandbox aprobado.
- Confirmar `ALLOWED_ORIGINS` con dominio final.
- Confirmar Google OAuth production redirect.
- Confirmar monitoreo y rollback.

## Riesgos criticos

- Exponer `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- Activar `ENABLE_AI_LEVEL4_OVERRIDE`.
- Usar PayPal live sin webhook validado.
- Bajar RLS para hacer pasar pruebas.
- Declarar produccion lista con `demo_or_partial`.

## Estrategia

1. Fortalecer matriz de variables y `production:check`.
2. Crear runbooks Supabase, PayPal, Google, CORS, panel IA y deploy.
3. Agregar scripts SQL de verificacion.
4. Reemplazar placeholder analytics por tracking real minimo.
5. Ejecutar validacion final completa.

## Comandos de validacion final

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run production:check
npm run production:check -- --strict
npm run test:e2e
```
