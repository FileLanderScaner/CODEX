# Checklist funcional

| Funcion | Estado | Problema | Correccion aplicada | Test | Pendiente externo |
|---|---|---|---|---|---|
| Busqueda de productos | Operativa | Depende de Supabase/catalogos o fallback | Verificada por tests y codigo | Vitest existente | E2E visual periodico |
| Listado de productos | Operativo API | Requiere Supabase para datos reales | Sin cambios | Integration tests | Migraciones aplicadas |
| Detalle de producto | Operativo | Sin precios muestra estado vacio | Verificado | Smoke pendiente | Datos reales por producto |
| Comparacion de precios | Operativa | Calidad depende de fuentes | Agente de precio agregado | `tests/unit/ai-agents.test.js` | Fuentes oficiales |
| Calculo de ahorro | Operativo | No considera siempre traslado salvo carrito | SavingsOptimizerAgent usa costo traslado | Unit agentes | UX de ahorro neto |
| Carrito optimo | Operativo API | UI limitada | Agente usa servicio existente | Tests existentes + agentes | E2E carrito |
| Favoritos | Operativo | Local/cloud segun auth | Sin cambios | Tests indirectos | Sync real con usuario |
| Autenticacion | Operativa | Fallback demo local | Sin cambios | Typecheck | Supabase real |
| Usuario premium | Parcial | `getSavingsSummary` mock; posible mismatch `isPremium` | Documentado | Pendiente | PayPal/Supabase |
| PayPal | Preparado | Requiere credenciales y planes | Protegido por docs/agentes | Tests existentes | Credenciales reales |
| WhatsApp/share | Operativo deep links | Business API no configurada | SupportWhatsAppAgent | Unit agentes | Twilio/Meta |
| Tracking eventos | Operativo con fallback | Dashboard externo falta | ObservabilityAgent | Tests growth existentes | Upstash/analytics |
| Personalizacion | Base local | No hay modelo persistente | PersonalizationAgent | Unit agentes | Tablas/eventos reales |
| Scraping/carga precios | Preparado | Debe respetar fuentes/robots | DataIngestionAgent | Tests fixtures | Convenios/API |
| Admin | Base minima | Bloqueado por env | `/admin/ai-agents` agregado | Typecheck/build | Auth admin real |
| Supabase | Preparado | Migracion de agentes no aplicada | SQL agregado | RLS pendiente de aplicar | Proyecto Supabase |
| Vercel deploy | Configurado | Variables pendientes | Docs actualizadas | Build | Env production |
