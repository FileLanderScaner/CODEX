# AhorroYA Monetization Plan

Fecha: 2026-05-10

## Estado

`MONETIZATION_STATUS=SANDBOX_READY_LIVE_BLOCKED`

## Principio

AhorroYA no debe cobrar dinero real hasta que el usuario reciba valor evidente y los gates externos de produccion esten completos.

## Lineas de ingreso

| Linea | Estado | Prioridad | Condicion para activar |
|---|---|---:|---|
| Premium B2C | Sandbox listo | P0 | PayPal live + OAuth production + soporte/cancelacion |
| Afiliados | Preparado parcialmente | P1 | proveedor real + disclosure |
| Ads | Conceptual | P2 | politica comercial + privacidad |
| Datos B2B | Conceptual | P2 | agregacion anonima + contratos |
| Comercios | Conceptual | P2 | propuesta comercial y panel/reportes |

## Premium B2C

Oferta inicial:

- Alertas ilimitadas.
- Favoritos ilimitados.
- Historial completo.
- Menos anuncios.
- Recomendaciones de ahorro cuando AI Gateway tenga gate seguro.

Pricing inicial sugerido para validar:

- Mensual bajo: UYU 99-149.
- Anual con descuento: 2 meses gratis.
- No activar precio real sin PayPal live verificado.

## PayPal live gate

Requisitos:

- `PAYPAL_ENV=live`.
- Live client id.
- Live client secret.
- Live webhook id.
- Live monthly/yearly plan ids.
- Webhook URL production.
- Firma PayPal live verificada.
- Suscripcion live controlada.
- Politica de cancelacion visible.

Estado actual:

`PAYPAL_LIVE_READY=false`

## Revenue tracking

Eventos requeridos:

- `premium_click`
- `premium_started`
- `premium_completed`
- `subscription_created`
- `subscription_activated`
- `subscription_cancelled`
- `payment_failed`

Estado:

- Eventos base de monetizacion existen.
- PayPal webhook sandbox validado.
- Falta dashboard financiero operativo.

## Afiliados

Activar solo cuando:

- Links identifican comercio y producto.
- Disclosure legal visible.
- Tracking de click funciona.
- No se degrada confianza de comparacion.

## Ads

No activar ads hasta:

- Tener retencion organica.
- Tener politica de privacidad revisada.
- Evitar anuncios que contradigan ranking de ahorro.

## Datos B2B

Potencial:

- Tendencias de precios por zona.
- Productos mas buscados.
- Alertas de demanda.
- Benchmark anonimo por comercio.

Restricciones:

- Solo datos agregados.
- Sin datos personales identificables.
- Contratos y privacidad antes de vender.

## Decision actual

`REVENUE_DECISION=NO_REAL_CHARGES_UNTIL_EXTERNAL_GATES`

La monetizacion esta preparada para sandbox y validacion de intencion. Cobro real queda bloqueado por credenciales y verificaciones externas.
