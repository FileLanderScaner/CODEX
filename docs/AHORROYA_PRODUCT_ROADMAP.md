# AhorroYA Product Roadmap

Fecha: 2026-05-10

## Estado

`PRODUCT_STATUS=PREPROD_READY_WITH_ROADMAP`

## Producto minimo defendible

El producto debe ganar por velocidad, claridad y confianza:

1. Busqueda rapida.
2. Mejor precio claro.
3. Ahorro visible.
4. Accion inmediata: alerta o compartir.
5. Datos con fuente/timestamp.

## Roadmap por fases

### Fase 0 - Preproduccion actual

Estado: completo tecnicamente.

- Landing.
- Busqueda.
- Comparacion.
- Detalle.
- Favoritos.
- Alertas.
- Premium sandbox.
- PayPal sandbox.
- Tracking base.
- RLS validado.
- Audit limpio.

### Fase 1 - Beta cerrada Uruguay

Objetivo: validar valor con usuarios reales sin cobros live.

Entregables:

- E2E browser ampliado.
- Lista de testers.
- Flujo de feedback.
- Dashboard de busquedas/shares/alertas.
- Runbook de soporte.

Criterios:

- Activation > 60%.
- Share rate > 15%.
- Alert/favorite rate > 25%.
- Errores criticos = 0.

### Fase 2 - Monetizacion controlada

Objetivo: habilitar cobro real solo con gates completos.

Entregables:

- PayPal live validado.
- Google OAuth production validado.
- Vercel Production env validado.
- Backup/revert production real.
- Politica de cancelacion.
- Email/soporte minimo.

### Fase 3 - Retencion

Objetivo: que el usuario vuelva por alertas y ahorro acumulado.

Entregables:

- Alertas mejoradas.
- Historial de ahorro.
- Resumen semanal.
- Segmentos por productos frecuentes.
- Recomendaciones no autonomas.

### Fase 4 - Escala LATAM

Objetivo: replicar Uruguay a otros paises con adapters.

Entregables:

- Fuentes por pais.
- Normalizacion de productos.
- Moneda/impuestos/localizacion.
- Ranking por cobertura y confianza.

## Backlog priorizado

| Prioridad | Item | Impacto | Riesgo |
|---|---|---|---|
| P0 | E2E flujo completo search -> ahorro -> alerta/share | confianza release | bajo |
| P0 | PayPal live gate | revenue | externo |
| P0 | Google OAuth production | login real | externo |
| P1 | Timestamp/fuente visible por precio | confianza | bajo |
| P1 | Dashboard beta AARRR | decision comercial | medio |
| P1 | Copy de primer uso | activacion | bajo |
| P2 | Afiliados con disclosure | revenue | medio |
| P2 | Ads policy | revenue | medio |
| P2 | B2B data spec | revenue | medio |
| P3 | AI recomendaciones read-only | diferenciacion | medio |

## AI roadmap

Estado actual:

- AI Gateway apagado.
- Agentes IA apagados.
- Defaults seguros.

Proximo paso seguro:

- Recomendaciones read-only en staging.
- Sin acciones autonomas.
- Logs y auditoria.
- RLS para tablas agent.

## Decision actual

`PRODUCT_DECISION=SHIP_CLOSED_BETA_WHEN_EXTERNAL_STAGING_ACCESS_IS_READY`

No promover produccion hasta completar gates productivos.
