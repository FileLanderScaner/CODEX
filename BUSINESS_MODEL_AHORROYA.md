# BUSINESS MODEL AHORROYA

## 1. TAM/SAM/SOM

Supuestos explícitos:
- Uruguay: 3.5M habitantes, 1.25M hogares, gasto mensual promedio de supermercado/farmacia de USD 350 por hogar.
- LATAM objetivo fase 2: UY, AR, CL, CO, MX, PE, 210M hogares urbanos digitalizables.
- AhorroYA monetiza usuarios activos mensuales, clicks afiliados, campañas internas, datos agregados y leads comerciales.

TAM Uruguay: 1.25M hogares x USD 350 x 12 = USD 5.25B/año de gasto comparable.
SAM Uruguay inicial: 450k hogares urbanos con compra digital/comparación activa x USD 350 x 12 = USD 1.89B/año.
SOM 24 meses Uruguay: 40k MAU, 12k hogares recurrentes, USD 50.4M/año de gasto influenciable.
SAM LATAM fase 2: 45M hogares urbanos comparables x USD 280 x 12 = USD 151.2B/año.

## 2. Ingresos

Premium B2C: USD 4.99 mensual o USD 39 anual. Features: alertas avanzadas, carrito óptimo, historial extendido, digest, sin ads.
Afiliados: tracking por tienda/producto/usuario en `affiliate_clicks`; revenue por CPC/CPA negociado.
Ads inteligentes: campañas por categoría/slot con `ad_campaigns`, `ad_impressions`, `ad_clicks`; sin publicidad hardcodeada.
Data B2B: dashboard/export con demanda, top productos, variación por tienda/zona.
Leads comerciales: formularios B2B en `commercial_leads` para marcas, supermercados y agencias.

## 3. Escenarios

Conservador: 1.5% premium, ARPU premium USD 4.20 neto, afiliados USD 0.015/MAU, ads USD 0.02/MAU, data/leads USD 300 MRR desde 10k MAU.
Base: 3.5% premium, ARPU premium USD 4.50 neto, afiliados USD 0.05/MAU, ads USD 0.06/MAU, data/leads USD 1,200 MRR desde 10k MAU.
Agresivo: 7% premium, ARPU premium USD 4.70 neto, afiliados USD 0.12/MAU, ads USD 0.14/MAU, data/leads USD 4,000 MRR desde 40k MAU.

## 4. Fórmulas

MAU = usuarios únicos con búsqueda, alerta, favorito o share en 30 días.
Premium users = MAU x conversión premium.
Premium MRR = premium users x ARPU premium neto.
Blended ARPU = MRR total / MAU.
Churn mensual = cancelaciones premium del mes / premium users inicio de mes.
LTV = ARPU premium neto x margen bruto / churn mensual.
CAC máximo viable = LTV x 0.33.
Payback = CAC / ARPU premium neto.

## 5. MRR Estimado

| MAU | Conservador | Base | Agresivo |
| --- | ---: | ---: | ---: |
| 1,000 | USD 98 | USD 278 | USD 483 |
| 10,000 | USD 1,080 | USD 3,375 | USD 8,600 |
| 40,000 | USD 4,620 | USD 14,100 | USD 21,280 |
| 100,000 | USD 11,800 | USD 36,500 | USD 51,000 |

## 6. Riesgos

Scraping legal/ToS: supermercados pueden bloquear o limitar extracción.
Dependencia de datos: sin feeds confiables baja la confianza del ranking.
Bloqueos técnicos: cambios de HTML/API rompen adapters.
Baja conversión premium: usuarios pueden percibir comparación básica como suficiente.
Unit economics: CAC pago puede superar LTV si no hay loop viral.

## 7. Mitigación

Priorizar fuentes públicas, APIs oficiales y acuerdos comerciales antes que scraping frágil.
Guardar `confidence_score`, fuente, fecha y estado para explicar cada dato.
Diseñar adapters con rate limit, retries, logs y fallback a link oficial.
Hacer premium útil solo cuando hay ahorro demostrado: carrito óptimo, alertas y digest.
Usar WhatsApp/referrals para adquisición orgánica y reservar paid growth para cohorts con LTV validado.
