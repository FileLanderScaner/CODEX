# AI Gateway integration - 2026-05-08

## Objetivo

Preparar Vercel AI Gateway para AhorroYA sin tocar produccion, sin activar agentes autonomos y sin cambiar el flujo de staging. La integracion queda detras de flags y usa `mock` por defecto.

## Uso previsto

- Asistente de ahorro.
- Explicacion de mejores precios.
- Analisis de carrito optimo.
- Soporte WhatsApp futuro.
- Agentes internos en modo lectura.

## Lo que no hace todavia

- No activa agentes autonomos.
- No escribe en Supabase.
- No reemplaza validaciones de staging/RLS.
- No usa AI Gateway desde frontend.
- No toca produccion.

## Dependencia

- `ai`

`@ai-sdk/gateway` queda como dependencia transitiva del AI SDK. No se instalo como dependencia directa.

## Archivos creados o modificados

- `scripts/ai-gateway-smoke.mjs`
- `package.json`
- `package-lock.json`
- `lib/env.js`
- `lib/ai-agents/AIProvider.js`
- `tests/unit/ai-provider.test.js`
- `.env.example`
- `.gitignore`

## Variables

```env
AI_PROVIDER=mock
AI_GATEWAY_ENABLED=false
AI_GATEWAY_MODEL=openai/gpt-5.5
AI_GATEWAY_MAX_OUTPUT_TOKENS=600
AI_GATEWAY_SMOKE_PROMPT_ENABLED=false
VERCEL_OIDC_TOKEN=
```

`VERCEL_OIDC_TOKEN` debe venir de Vercel con:

```powershell
npx vercel env pull .env.vercel.local --environment=preview --yes --scope akuma424-projects
```

Se usa `.env.vercel.local` para no pisar `.env.local`, que en este repo puede contener variables locales de Supabase/staging.

## Smoke test

```powershell
npm run ai:gateway:smoke
```

Estados:

- `AI_GATEWAY_SMOKE_PASS`: llamada Gateway completada.
- `AI_GATEWAY_SMOKE_FAIL`: Gateway respondio con error, rate limit, modelo no disponible o red.
- `BLOCKED_MISSING_GATEWAY_AUTH`: falta `VERCEL_OIDC_TOKEN` o `AI_GATEWAY_API_KEY`.
- `BLOCKED_SMOKE_PROMPT_DISABLED`: falta opt-in explicito `AI_GATEWAY_SMOKE_PROMPT_ENABLED=true`.
- `BLOCKED_VERCEL_AUTH`: `vercel env pull` falla por auth, scope o 403.

## Seguridad

- `AI_PROVIDER=mock` por defecto.
- `AI_GATEWAY_ENABLED=false` por defecto.
- `AI_GATEWAY_SMOKE_PROMPT_ENABLED=false` por defecto para evitar llamadas pagas accidentales.
- `ENABLE_AI_AGENTS=false` debe mantenerse hasta validar staging.
- `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY` debe mantenerse.
- `ENABLE_AI_LEVEL4_OVERRIDE=false` debe mantenerse.
- El provider `vercel_gateway` se bloquea si corre en browser.
- Contexto y errores se redactan para no enviar o imprimir secretos.
- No se envian service role keys, passwords, tokens ni DB URLs al modelo.

## Activacion futura en staging

1. Validar Supabase staging y RLS.
2. Confirmar Vercel preview con `.env.vercel.local`.
3. Mantener agentes apagados.
4. Cambiar solo en staging:

```env
AI_PROVIDER=vercel_gateway
AI_GATEWAY_ENABLED=true
AI_GATEWAY_MODEL=openai/gpt-5.5
```

5. Ejecutar `npm run ai:gateway:smoke`.
6. Revisar logs y costos en Vercel AI Gateway.

## AgentOrchestrator futuro

El `AgentOrchestrator` puede recibir `createAIProvider(readEnv())` solo para agentes read-only. Cualquier accion de escritura debe seguir bloqueada por permisos, dry-run y aprobacion humana.

## Rollback

1. Volver a:

```env
AI_PROVIDER=mock
AI_GATEWAY_ENABLED=false
```

2. Eliminar `scripts/ai-gateway-smoke.mjs` si se decide revertir completamente.
3. Quitar scripts `ai:gateway:*` de `package.json`.
4. Ejecutar `npm uninstall ai` si se decide remover la dependencia.
5. Verificar `npm run test && npm run build`.
