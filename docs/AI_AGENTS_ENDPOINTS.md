# AI agents endpoints

Base:

```http
/api/v1/ai/agents
```

Metodos soportados: `GET` y `POST`.

Requisitos:

- `ENABLE_ADMIN_AI_PANEL=true`
- Usuario autenticado
- `app_metadata.role` en `admin` o `internal_job`
- Para ejecutar agentes: `ENABLE_AI_AGENTS=true`
- `dryRun` es `true` por defecto

## Acciones

Listar:

```json
{ "action": "list" }
```

Ejecutar agente individual:

```json
{ "action": "run", "agent": "ProductAuditAgent", "input": {}, "dryRun": true }
```

Ejecutar agentes seguros:

```json
{ "action": "runAllSafe", "input": {}, "dryRun": true }
```

Historial:

```json
{ "action": "history", "limit": 20 }
```

Sugerencias:

```json
{ "action": "suggestions", "status": "pending", "limit": 20 }
```

Aprobar sugerencia:

```json
{ "action": "approveSuggestion", "suggestionId": "00000000-0000-0000-0000-000000000000" }
```

Rechazar sugerencia:

```json
{ "action": "rejectSuggestion", "suggestionId": "00000000-0000-0000-0000-000000000000", "reason": "No aplica al roadmap actual" }
```

## Bloqueos

- `ENABLE_ADMIN_AI_PANEL=false`: bloquea toda accion admin.
- Sin auth: bloquea.
- Sin rol `admin` o `internal_job`: bloquea.
- `ENABLE_AI_AGENTS=false`: bloquea `run` y `runAllSafe`.
- Produccion con `dryRun=false`: bloquea.
- `AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION` sin `ENABLE_AI_LEVEL4_OVERRIDE=true`: bloquea.

El endpoint no devuelve secretos ni variables sensibles.
