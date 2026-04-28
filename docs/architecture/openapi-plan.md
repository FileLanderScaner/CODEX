# OpenAPI plan

La especificacion mantenida vive en `docs/openapi.yaml`.

Reglas:

- Toda ruta nueva se crea en `/api/v1`.
- Request y response incluyen `request_id`.
- Los errores usan `{ request_id, error }`.
- Inputs se validan con zod.
- Rutas autenticadas usan Bearer token de Supabase.
- Rutas admin requieren rol en `app_metadata.role`.
- Import interno acepta rol `internal_job` o `X-Cron-Secret`.
