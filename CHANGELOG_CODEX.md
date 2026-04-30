# Changelog Codex

## 2026-04-30

### Entregado

- Agregado unificador de catalogos online para Disco, Devoto, Ta-Ta y Tienda Inglesa.
- Agregado endpoint Vercel `/api/v1/catalog/search?q=producto`.
- Agregada normalizacion de resultados de catalogos tipo JSON/VTEX y JSON-LD.
- Agregado fallback con links oficiales de busqueda por comercio cuando un catalogo no expone precio parseable.
- Integrada la busqueda de catalogos en el flujo principal de AhorroYA.
- Agregado estado visible de `Catalogos online` en resultados.
- Agregado seed local de precios de Montevideo para que la app tenga datos utiles sin Supabase/API.
- Implementada carga de precios con fallback: API oficial si responde, luego precios locales persistidos y seed.
- Implementado guardado comunitario con fallback local si `/api/v1/prices/community` no esta disponible.
- Implementada autenticacion demo local cuando faltan credenciales Supabase.
- Implementado panel de auth visible tambien en modo fallback.
- Implementadas alertas locales para usuarios anonimos o fallback.
- Implementada activacion Premium demo cuando falta PayPal.
- Corregido error runtime `AdBanner is not defined` en resultados de busqueda.
- Corregida estructura HTML de Favoritos para evitar acciones anidadas en web; se separo `Ver comparacion` de eliminar favorito.
- Reescrito `README.md` con ejecucion en un comando y variables opcionales.
- Agregada `AUDITORIA_FINAL.md` con auditoria, decisiones, implementacion y validacion.

### Validacion

- `npm install`: OK.
- `npm run test`: OK.
- `npm run build`: OK.
- `npm run web -- --port 8081`: OK.
- Tests unitarios de catalogos: OK.
- Verificacion navegador:
  - Home renderiza contenido real.
  - Busqueda `leche` muestra resultados y ahorro.
  - Busqueda muestra estado de catalogos online y links oficiales por comercio.
  - Favoritos permite volver a comparacion sin botones anidados.
  - Premium demo simula checkout exitoso.
  - QA full app en navegador embebido: 20/20 checks pasaron.
  - Sin errores criticos de consola.
