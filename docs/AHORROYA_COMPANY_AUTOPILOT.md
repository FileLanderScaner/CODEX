# AhorroYA Company Autopilot

Fecha: 2026-05-10

## Estado ejecutivo

`COMPANY_STATUS=PREPROD_READY_EXTERNAL_PRODUCTION_BLOCKERS`

AhorroYA ya tiene base tecnica suficiente para operar una preproduccion seria: app web, busqueda, comparacion, favoritos, alertas, premium sandbox, PayPal sandbox, Supabase RLS validado, Vercel Preview, audit npm limpio y gates de seguridad.

El cuello de botella principal ya no es construir mas features aisladas. El cuello de botella es convertir esta base en un negocio con usuarios reales, confianza, medicion y monetizacion controlada sin saltarse production gates.

## Tesis de empresa

AhorroYA ayuda a hogares de Uruguay/LATAM a decidir donde comprar al menor costo total, empezando por supermercados y productos frecuentes.

Promesa en 30 segundos:

1. Buscar producto.
2. Ver mejor precio.
3. Ver ahorro.
4. Guardar alerta o compartir ahorro.
5. Volver cuando el precio cambie.

## Norte estrategico

| Horizonte | Objetivo | Resultado esperado |
|---|---|---|
| 0-30 dias | Beta cerrada Uruguay | Primeros usuarios reales, busquedas y shares medidos |
| 30-60 dias | Monetizacion sandbox -> live controlada | Premium live listo con PayPal y OAuth production |
| 60-90 dias | Retencion y datos | Alertas, cohortes, comercios priorizados, reportes internos |
| 90+ dias | Escala LATAM | Reutilizar normalizadores y fuentes para nuevos mercados |

## Gates no negociables

- Produccion sigue `NO-GO_PRODUCTION` hasta tener credenciales/evidencias externas.
- PayPal live no se activa sin webhook live, firma verificada y prueba controlada.
- Google OAuth production no se activa sin redirect URIs reales.
- Supabase production no se toca sin backup y revert drill.
- AI Gateway/agentes IA siguen apagados por defecto.
- No se commitean `.env`, tokens ni credenciales.

## Ciclo autonomo actual

### 1. Diagnostico

- Tecnico: preproduccion aprobada.
- Producto: usable para staging con backlog.
- Growth: tracking y WhatsApp share existen, falta operar beta real.
- Monetizacion: PayPal sandbox listo, live bloqueado por credenciales.
- Produccion: bloqueada por evidencias externas.

### 2. Mayor cuello de botella

`BOTTLENECK=EXTERNAL_PRODUCTION_CREDENTIALS_AND_BETA_OPERATIONS`

Sin credenciales live ni evidencia de dashboards production, no corresponde promover produccion ni cobrar dinero real.

### 3. Accion concreta dentro del repo

Se definen planes ejecutivos para:

- Growth.
- Monetizacion.
- Producto.
- Estado autonomo machine-readable.

### 4. Validacion tecnica

Cada cambio debe mantener:

- `npm audit`: PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run test`: PASS.
- `npm run build`: PASS.
- `npm run staging:check`: PASS.
- `npm run production:check`: PASS tecnico sin promover.
- `npm run test:rls`: PASS cuando haya entorno local/staging.

### 5. Evaluacion comercial

AhorroYA solo debe cobrar cuando:

- El usuario entiende el ahorro antes del paywall.
- Premium ofrece alertas/seguimiento claro.
- PayPal live esta verificado.
- Soporte/cancelacion estan documentados.
- Hay metricas de activacion y conversion.

## Modelo operativo

| Area | Owner conceptual | Cadencia | KPI |
|---|---|---|---|
| Producto | Head of Product | semanal | busquedas con ahorro visible |
| Growth | Growth Lead | semanal | shares, invites, activacion |
| Monetizacion | CFO | semanal | trial/premium conversion |
| Seguridad | CTO/Security | por release | gates PASS, secretos 0 |
| Datos | CTO/Product | semanal | cobertura por producto/comercio |

## Decision actual

`COMPANY_AUTOPILOT_DECISION=BLOCKED_EXTERNAL_CREDENTIALS`

No es un bloqueo de codigo. Es un bloqueo correcto de negocio/operacion: faltan credenciales y verificaciones externas para operar produccion real.

## Proximo ciclo generado

```text
NEXT_COMPANY_AUTOPILOT_CYCLE

Objetivo:
Preparar beta cerrada no productiva con usuarios reales controlados en preview/staging, sin cobros live.

Acciones:
1. Definir lista de tareas operativas para beta cerrada.
2. Preparar criterios de exito AARRR.
3. Validar que el flujo search -> ahorro -> alerta/share funcione.
4. Mantener PayPal sandbox y production NO-GO.

Condicion de exito:
Beta cerrada queda lista para ejecutar cuando exista grupo de testers y URLs/credenciales staging.

Condicion de bloqueo:
Si la siguiente accion requiere PayPal live, OAuth production, DNS o envs production reales, mantener BLOCKED_EXTERNAL_CREDENTIALS.
```
