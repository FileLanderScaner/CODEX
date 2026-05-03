# Staging manual smoke tests

| Prueba | Pasos | Resultado esperado | Evidencia | Estado |
|---|---|---|---|---|
| Carga home | Abrir `https://<staging-domain>` | Home carga sin error visible | Captura | Pendiente |
| Buscar leche | Buscar `leche` | Resultados o fallback catalog visible | Captura/request id | Pendiente |
| Buscar yerba | Buscar `yerba` | Resultados o fallback catalog visible | Captura/request id | Pendiente |
| Detalle producto | Abrir un producto | Detalle con precio/tienda visible | Captura | Pendiente |
| Comparar precios | Ver seccion de precios | Muestra minimo/promedio/opciones | Captura | Pendiente |
| Calculo ahorro | Revisar ahorro mostrado | Ahorro no se presenta como real si viene de fallback | Captura | Pendiente |
| Agregar favorito | Login y marcar favorito | Favorito persiste en cloud | Fila/ver UI | Pendiente |
| Crear alerta | Crear alerta de precio | Alerta persiste | Fila/ver UI | Pendiente |
| Login Google | Iniciar sesion con Google | Sesion activa | Captura usuario | Pendiente |
| Ver perfil | Abrir perfil | Perfil muestra datos seguros | Captura | Pendiente |
| Premium sandbox | Iniciar flujo premium sandbox | Checkout sandbox abre | Captura | Pendiente |
| Ver `premium_until` | Completar compra sandbox | `premium_until` actualizado | Fila Supabase | Pendiente |
| WhatsApp deep link | Compartir ahorro/carrito | Abre link WhatsApp sin spam automatico | URL/captura | Pendiente |
| Tracking `app_loaded` | Abrir app | Evento registrado o fallback local | Fila/log | Pendiente |
| Tracking `search_submitted` | Buscar producto | Evento registrado | Fila/log | Pendiente |
| Tracking `commerce_clicked` | Click comercio | Evento registrado | Fila/log | Pendiente |
| `/api/v1/readiness` | `curl -i https://<staging-domain>/api/v1/readiness` | 200 y sin secretos | Output | Pendiente |
| `/api/v1/health` | `curl -i https://<staging-domain>/api/v1/health` | 200 o respuesta saludable esperada | Output | Pendiente |
| Panel IA bloqueado | Abrir `/admin/ai-agents` con flag false | Pantalla bloqueada | Captura | Pendiente |
| Panel IA admin dry-run | Con flag/rol staging controlado, ejecutar agente dry-run | Resultado dry-run, sin Level 4 | Captura/log | Pendiente |
| Usuario normal sin panel IA | Usuario sin rol abre panel | Acceso denegado | Captura | Pendiente |
| Level 4 bloqueado | Intentar accion Level 4 o override ausente | Bloqueado | Respuesta API/log | Pendiente |

Notas:

- No usar PayPal live.
- No cambiar `ENABLE_AI_LEVEL4_OVERRIDE=false`.
- No desactivar RLS para resolver errores.
- Guardar request ids cuando existan.
