# PayPal staging execution checklist

Mantener siempre `PAYPAL_ENV=sandbox` en staging.

| Paso | Accion | Evidencia | Estado |
|---|---|---|---|
| 1 | Crear PayPal REST app sandbox | App id sandbox | Pendiente |
| 2 | Obtener client id publico sandbox | `EXPO_PUBLIC_PAYPAL_CLIENT_ID` cargado en Vercel | Pendiente |
| 3 | Obtener client id servidor sandbox | `PAYPAL_CLIENT_ID` cargado en Vercel server env | Pendiente |
| 4 | Obtener client secret servidor sandbox | `PAYPAL_CLIENT_SECRET` cargado solo server env | Pendiente |
| 5 | Crear producto/plan mensual | `PAYPAL_MONTHLY_PLAN_ID` | Pendiente |
| 6 | Crear producto/plan anual | `PAYPAL_YEARLY_PLAN_ID` | Pendiente |
| 7 | Configurar webhook sandbox | `PAYPAL_WEBHOOK_ID` | Pendiente |
| 8 | Agregar endpoint webhook | `https://<staging-domain>/api/v1/billing/webhooks/paypal` | Pendiente |
| 9 | Suscribir eventos requeridos | Lista de eventos | Pendiente |
| 10 | Configurar variables Vercel staging | Captura sin secretos visibles | Pendiente |
| 11 | Probar compra sandbox mensual | Subscription id sandbox | Pendiente |
| 12 | Probar compra sandbox anual si aplica | Subscription id sandbox | Pendiente |
| 13 | Verificar `premium_until` | Fila perfil/subscription actualizada | Pendiente |
| 14 | Verificar que premium demo no figure como real | UI/API muestra source real solo con sandbox | Pendiente |
| 15 | Probar cancelacion o fallo | Estado cancelado/fallido procesado | Pendiente |
| 16 | Ejecutar smoke premium | Captura y request id | Pendiente |

## Eventos webhook necesarios

- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `PAYMENT.CAPTURE.COMPLETED`

## Variables Vercel

```env
PAYPAL_ENV=sandbox
EXPO_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_MONTHLY_PLAN_ID=
PAYPAL_YEARLY_PLAN_ID=
```

## Criterios para pasar a live

- Sandbox end-to-end aprobado.
- Webhook sandbox valida firma.
- `premium_until` se actualiza correctamente.
- Cancelacion/fallo probado.
- No hay premium demo marcado como pago real.
- `docs/STAGING_RELEASE_CANDIDATE_REPORT.md` aprobado.
- `docs/PRODUCTION_GO_NO_GO.md` sin No-Go.

## Bloqueos para live

- `PAYPAL_ENV=sandbox` no paso smoke.
- Falta `PAYPAL_WEBHOOK_ID`.
- Webhook no valida firma.
- `premium_until` no se actualiza.
- Secretos PayPal expuestos en frontend.
- Produccion aun en No-Go.
