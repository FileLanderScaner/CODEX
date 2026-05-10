# Production revert SQL plan

## Estado

`REVERT_SQL_STATUS=MANUAL_BLOCKER`

`PRODUCTION_STATUS=NO-GO_PRODUCTION`

Este plan define como revertir cambios production. No ejecuta migraciones ni rollback por si mismo.

## Criterios para activar revert

Activar revert si ocurre cualquiera de estos casos despues del deploy:

- Errores 5xx sostenidos en APIs criticas.
- Fallo de auth, login o signup production.
- Fallo de pagos live o webhooks live.
- RLS expone datos no autorizados o bloquea flujos criticos.
- Perdida/corrupcion de datos.
- `production:check` deja de cumplir `production_ready`.
- Error de migracion que no puede corregirse dentro de la ventana aprobada.

## Rollback de schema

Antes de production debe existir para cada migracion:

- Lista de objetos creados/modificados.
- SQL forward.
- SQL reverse cuando sea seguro.
- Riesgo de perdida de datos.
- Validacion post-revert.

Reglas:

- No hacer rollback destructivo sin aprobacion explicita.
- Preferir revert idempotente y reversible.
- Si hay cambios de datos, tomar backup adicional antes del revert.
- Si una migracion no es reversible, documentar restore desde backup como unico camino.

## Rollback de env/config

Vercel Production env:

- Mantener copia redaccionada de nombres y valores esperados fuera del repo.
- Revertir variables al set anterior desde Dashboard o CLI solo con aprobacion.
- No imprimir valores.
- Mantener `AI_PROVIDER=mock`, `AI_GATEWAY_ENABLED=false`, `ENABLE_AI_AGENTS=false`, `ENABLE_ADMIN_AI_PANEL=false` y `ENABLE_AI_LEVEL4_OVERRIDE=false` salvo aprobacion futura.

PayPal:

- Si PayPal live falla, deshabilitar temporalmente entrypoints de pago o volver a flujo anterior aprobado.
- No cambiar sandbox/live en staging.
- Registrar eventos afectados y webhook delivery status.

Google OAuth:

- Revertir callbacks/origins al set anterior aprobado si login production falla.

## Rollback de deployment

Vercel:

- Identificar ultimo deployment production estable.
- Revertir desde Dashboard o comando aprobado solo durante ventana production.
- No usar `vercel promote` desde preprod sin aprobacion humana explicita.
- Verificar `/api/v1/health`, `/api/v1/readiness`, login, busqueda y pago despues del rollback.

## Responsables

- Release Manager: decide activar rollback durante ventana.
- Security Engineer: valida RLS/auth/secrets.
- Database owner: ejecuta o aprueba SQL revert/restore.
- Payments owner: valida PayPal live/webhook.
- Product owner: aprueba impacto funcional.

## Tiempos maximos

- Triage inicial: 10 minutos.
- Decision rollback/no rollback: 15 minutos desde deteccion.
- Rollback app/env: 15 minutos desde decision.
- Revert SQL simple: 30 minutos desde decision.
- Restore desde backup: segun estimacion del proveedor, con comunicacion cada 15 minutos.

## Validacion post-revert

Ejecutar y registrar:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run production:check
```

Validar manualmente:

- Health/readiness production.
- Login/signup.
- Busqueda y detalle de producto.
- PayPal live si estaba dentro del cambio.
- RLS smoke production solo con usuarios/control aprobados.

Si el revert plan no esta aprobado: `PRODUCTION_STATUS=NO-GO_PRODUCTION`.
