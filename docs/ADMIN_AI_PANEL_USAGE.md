# Admin AI panel usage

Ruta:

```text
/admin/ai-agents
```

Estado por defecto:

- Bloqueado si `ENABLE_ADMIN_AI_PANEL=false`.
- Requiere usuario autenticado.
- Requiere rol `admin` o `internal_job` para que la API responda.

El panel muestra:

- Flags de IA.
- Nivel de autonomia.
- Provider IA.
- Modo dry-run.
- Persistencia Supabase o fallback local.
- Lista de agentes.
- Ejecucion `runAllSafe` en dry-run.
- Resumen de ultima ejecucion.
- Sugerencias pendientes cuando la API las devuelve.

El panel no permite:

- Activar `LEVEL_4_CONTROLLED_EXECUTION`.
- Aplicar cambios productivos.
- Tocar pagos.
- Tocar credenciales.
- Borrar datos.
- Publicar contenido externo.

Configuracion recomendada para staging:

```env
ENABLE_ADMIN_AI_PANEL=true
ENABLE_AI_AGENTS=true
AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY
AI_PROVIDER=mock
ENABLE_AI_LEVEL4_OVERRIDE=false
```
