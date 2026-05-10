# AhorroYA Growth Plan

Fecha: 2026-05-10

## Estado

`GROWTH_STATUS=READY_FOR_CLOSED_BETA`

## Objetivo growth

Lograr que un usuario nuevo vea ahorro real en menos de 30 segundos y comparta o guarde una alerta en la primera sesion.

## Funnel AARRR

| Etapa | Evento | Meta beta | Instrumentacion |
|---|---|---:|---|
| Acquisition | landing visit | 100 sesiones beta | `landing_view`, `web_session_started` |
| Activation | primera busqueda | 60% de sesiones | `search_submitted`, `search_product` |
| Retention | favorito/alerta | 25% de activados | `add_favorite`, `create_alert` |
| Referral | share/WhatsApp | 15% de activados | `share`, `share_click`, `click_whatsapp` |
| Revenue | premium intent | 5% de activados | `premium_click`, `premium_started` |

## Loop viral

1. Usuario busca producto frecuente.
2. App muestra ahorro claro.
3. CTA principal: compartir ahorro por WhatsApp.
4. Link compartido conserva `utm_source=whatsapp`.
5. Receptor abre busqueda prellenada.
6. Se mide `share_click`.

## Onboarding de 30 segundos

Prioridad:

1. Mostrar 3 busquedas sugeridas visibles.
2. Al primer resultado, destacar ahorro en una linea.
3. Dar dos acciones: `Avisarme` y `Compartir`.
4. Evitar pedir registro antes de mostrar valor.
5. Pedir login solo para sincronizar favoritos/alertas y premium.

## Canales iniciales Uruguay

| Canal | Tactica | Motivo |
|---|---|---|
| WhatsApp | comparaciones compartibles | canal cotidiano de hogares |
| TikTok/Reels | videos "donde esta mas barato" | alta demostracion visual |
| Grupos barriales | ofertas por zona | contexto local |
| SEO long-tail | "precio leche Montevideo" | demanda activa |
| Comercios chicos | links/catalogos | oferta diferenciada |

## Experimentos beta

| Experimento | Hipotesis | Exito |
|---|---|---|
| CTA WhatsApp en mejor precio | Compartir aumenta adquisicion organica | share rate > 15% |
| Alerta despues de ahorro | Retencion sube cuando el usuario guarda seguimiento | alert rate > 20% |
| Landing con ahorro local | Usuario entiende valor sin explicacion larga | activation > 60% |
| Premium despues de 2 ahorros | Paywall contextual convierte mejor | premium intent > 5% |

## Metricas operativas

- Busquedas por usuario.
- % busquedas con ahorro detectado.
- Ahorro medio mostrado.
- Clicks WhatsApp.
- Shares entrantes.
- Favoritos por usuario.
- Alertas activas.
- Premium intent.
- Errores cliente/API.

## Bloqueos

- No usar ads pagos hasta tener conversion base organica.
- No prometer ahorro garantizado sin cobertura de datos suficiente.
- No activar PayPal live hasta production gate.

## Proxima accion segura

Ampliar E2E y dashboard interno de metricas beta cuando se decida operar testers reales en staging/preview.
