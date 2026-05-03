# Staging admin AI panel test plan

Ruta: `/admin/ai-agents`.

## Casos

- `ENABLE_ADMIN_AI_PANEL=false`: debe mostrar panel bloqueado y no ejecutar acciones.
- `ENABLE_ADMIN_AI_PANEL=true` sin sesion: API debe devolver 401 y UI mostrar error.
- Usuario autenticado sin rol admin/internal_job: API debe devolver 403.
- Usuario `admin`: debe listar agentes, estado, historial y sugerencias.
- Usuario `internal_job`: debe poder listar y ejecutar dry-run si `ENABLE_AI_AGENTS=true`.
- `ENABLE_AI_AGENTS=false`: debe listar, pero `run` y `runAllSafe` deben devolver `ai_agents_disabled`.
- `ENABLE_AI_AGENTS=true`: `runAllSafe` debe ejecutarse en dry-run.
- `AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION` con override false: debe bloquearse.

## No permitido

- Activar level 4 desde UI.
- Aplicar sugerencias automaticamente.
- Tocar pagos.
- Tocar credenciales.
- Borrar datos.
