# AhorroYA 50 User Launch Playbook

## Objetivo

Validar con 50 usuarios reales si AhorroYA se entiende rapido, muestra ahorro, genera acciones de valor, se comparte y logra retorno en 72 horas. Durante esta etapa no se tocan backend, schema, scraping ni arquitectura salvo bug critico de login, pago, busqueda o tracking.

## Hipotesis De Exito

| Hipotesis | Senal | Meta 50 usuarios |
| --- | --- | ---: |
| Valor rapido | `search_product / open_app` en primer dia | 60% |
| Comprension | usuario explica "donde compro mas barato" | 50% |
| Impacto | `view_best_price`, `commerce_clicked`, `add_favorite` o `create_alert` | 25% |
| Viralidad | `share`, `click_whatsapp` o `share_click` | 15% |
| Retencion | usuario vuelve dentro de 72h | 30% |
| Monetizacion | `premium_click`, `premium_started`, `premium_completed` | 5 clicks, 1-3 pagos/intentos |

## Cohortes

- 20 conocidos de Montevideo que compran super semanalmente.
- 10 hogares con hijos o compra recurrente de panales/farmacia.
- 10 estudiantes u hogares compartidos.
- 5 usuarios sensibles a ofertas de carne/yerba/leche.
- 5 comercios, marcas o potenciales partners para lectura B2B.

## Mensaje De Invitacion

```text
Estoy lanzando AhorroYA en Montevideo con 50 usuarios reales.
Proba buscar yerba, leche, arroz, panales o carne y decime si encontraste un ahorro que te sirva.
Si ves un precio mal, avisame. Si te sirve, comparti el ahorro por WhatsApp.
Link: <URL>
```

## Observacion Diaria

Mirar el camino por usuario:

1. Abre app.
2. Hace busqueda.
3. Ve mejor precio.
4. Toca detalle, comercio, favorito, alerta o share.
5. Vuelve dentro de 72 horas.

Preguntas cualitativas:

- Que pensaste que hacia la app?
- Que buscaste primero?
- Hubo un momento donde dijiste "esto sirve"?
- Que te impidio compartir o volver?

## Reglas De Iteracion En 24h

- Si `search_product / open_app < 50%`: cambiar hero, buscador y chips iniciales.
- Si `view_best_price / search_product < 40%`: reordenar productos sugeridos y aclarar resultados.
- Si `share / search_product < 10%`: mover CTA de WhatsApp al bloque de ahorro y reescribir mensaje.
- Si retorno 72h `< 20%`: empujar favoritos, alertas y recordatorio manual.
- Si `premium_click / view_best_price < 5%`: retrasar paywall o reescribirlo con ahorro real.

Permitido:

- Copy.
- Orden de productos.
- CTAs.
- Triggers de premium/share/alerta.
- Campanas y cohorts.

No tocar:

- Backend serverless.
- Supabase schema/RLS.
- PayPal/Auth salvo bug critico.
- Scrapers/adapters.
- Pricing fino de Premium.

## Query Diario

```sql
select event_name, count(*) as events
from monetization_events
where created_at >= now() - interval '24 hours'
group by event_name
order by events desc;
```

```sql
select
  count(*) filter (where event_name = 'open_app') as open_app,
  count(*) filter (where event_name = 'search_product') as searches,
  count(*) filter (where event_name = 'view_best_price') as best_price_views,
  count(*) filter (where event_name in ('share','click_whatsapp')) as shares,
  count(*) filter (where event_name = 'add_favorite') as favorites,
  count(*) filter (where event_name = 'create_alert') as alerts,
  count(*) filter (where event_name = 'premium_click') as premium_clicks,
  count(*) filter (where event_name = 'premium_completed') as premium_completed
from monetization_events
where created_at >= now() - interval '24 hours';
```

## Momento WOW

Se considera WOW si despues de ver ahorro el usuario:

- comparte,
- crea alerta,
- guarda favorito,
- abre comercio,
- busca otro producto,
- pregunta por carrito.

Amplificar el WOW mostrando: "Encontraste $X de diferencia", seguido de "Compartir este ahorro" y "Avisarme si baja".

## Escalar A 500

Solo escalar si durante 7 dias:

- 60% hace busqueda util.
- 25% hace accion de valor.
- 10% comparte.
- 30% vuelve dentro de 72h.
- Hay evidencia cualitativa de WOW.
- Top 20 productos tienen datos confiables.

Canales para 500:

- 300 por WhatsApp/referrals.
- 100 por comunidades barriales.
- 50 por grupos de madres/padres o estudiantes.
- 50 por microinfluencers de ahorro/compras.
