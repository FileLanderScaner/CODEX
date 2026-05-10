# Production Go/No-Go

## Decision vigente

`PRODUCTION_STATUS=NO-GO_PRODUCTION`

Staging esta sano y revisable, pero produccion queda bloqueada por politica de release hasta completar el checklist manual y registrar aprobacion humana explicita. Este documento es el gate operativo: si falta un punto de desbloqueo, no se debe tocar Production.

Estado staging confirmado:

- Rama `codex/production-deploy-ready` subida.
- Vercel Preview `Ready`.
- RLS SQL PASS con Session Pooler.
- AI Gateway apagado.
- Agentes IA apagados.
- PayPal en sandbox.
- Produccion intacta.

## Comandos y acciones prohibidas hasta aprobacion

No ejecutar ni activar:

- `npx vercel --prod`
- `npx vercel deploy --prod`
- `npx vercel promote`
- cambios en Vercel Production env
- migraciones contra Supabase production
- `supabase db push` contra production
- PayPal live
- Google OAuth production como flujo activo
- `AI_GATEWAY_ENABLED=true`
- `ENABLE_AI_AGENTS=true`
- commits de `.env`, `.env.local`, `.env.rls` o secretos

## Checklist de desbloqueo production

Production solo puede pasar a `GO_PRODUCTION` cuando todo esto este completo y auditado:

- Supabase Auth leaked password protection revisado y activado si aplica.
- Backup SQL tomado y verificable antes de cambios production.
- Revert plan SQL escrito, revisado y aplicable.
- Vercel Production env configurado con variables reales, sin exponer valores en repo/logs.
- PayPal live configurado, separado de sandbox y con webhook live validado.
- Google OAuth production configurado con origins/callbacks reales.
- Ventana de deploy definida con responsables y canal de coordinacion.
- Aprobacion humana explicita registrada para produccion.

Si falta cualquiera de esos puntos: `PRODUCTION_STATUS=NO-GO_PRODUCTION`.

## Matriz tecnica

| Area | Estado requerido | Estado actual | Go/No-Go | Evidencia |
|---|---|---|---|---|
| Build | `npm run build` OK | OK local | Go tecnico staging | Validacion RC |
| Tests | Lint/typecheck/Vitest OK | OK local | Go tecnico staging | Suite local |
| Supabase staging | Schema/RLS staging validado | OK staging | Go staging | Session Pooler + RLS PASS |
| RLS | Normal bloqueado, admin/internal_job permitido | OK staging | Go staging | `rls_validation: PASS` |
| Vercel Preview | Deployment Preview Ready | OK staging | Go staging | Vercel Preview |
| Vercel Production env | Variables reales production configuradas | Pendiente manual | No-Go production | Env matrix |
| PayPal | Sandbox aprobado, live pendiente | Sandbox OK | No-Go production | PayPal runbook |
| Google Auth | Staging aprobado, production pendiente | Pendiente production | No-Go production | Google runbook |
| CORS | `ALLOWED_ORIGINS` production exacto | Pendiente production | No-Go production | CORS doc |
| IA | Off by default, dry-run | OK por config | Go | Flags docs |
| Observabilidad | Eventos app/session reales | Implementado minimo | Go staging | Tracking service |

Decision actual: `NO-GO_PRODUCTION`. Staging esta listo para revision; produccion no se desbloquea sin checklist manual completo.
