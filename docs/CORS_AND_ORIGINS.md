# CORS and origins

## Variable

```env
ALLOWED_ORIGINS=https://<staging-domain>,https://<production-domain>,http://localhost:8081
```

## Reglas

- Usar origins completos, sin slash final.
- No usar `*` en staging/produccion.
- Incluir localhost solo para desarrollo.
- Mantener separado preview/staging/produccion si tienen dominios distintos.

## Como probar

```bash
curl -i https://<domain>/api/v1/readiness \
  -H "Origin: https://<staging-domain>"
```

Debe devolver:

```text
Access-Control-Allow-Origin: https://<staging-domain>
```

Un origin no listado no debe recibir su propio origin en respuesta.

## Deteccion de errores

- Browser muestra CORS blocked.
- `OPTIONS` no devuelve 204.
- `ALLOWED_ORIGINS` tiene slash final o dominio equivocado.
