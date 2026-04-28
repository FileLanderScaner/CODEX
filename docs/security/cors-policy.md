# CORS policy

`ALLOWED_ORIGINS` es una lista exacta por entorno. No usar comodines en produccion.

Ejemplo produccion:

```env
ALLOWED_ORIGINS=https://app.ahorroya.com,https://admin.ahorroya.com,https://b2b.ahorroya.com
```

Las rutas `/api/v1` devuelven `Vary: Origin` y no aceptan origenes no listados.
