# Fase 2 - Plan de ejecucion

Fecha: 2026-05-02.
Rama: `codex/production-deploy-ready`.

## Estado inicial detectado

- La rama contiene la primera arquitectura de agentes IA en `lib/ai-agents`.
- `git status`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` y `npm run production:check` fueron ejecutados antes de modificar codigo.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` y `npm run production:check` pasan antes de esta fase.
- `production:check` reporta `demo_or_partial` porque faltan PayPal, Google Auth y `ALLOWED_ORIGINS`.
- La migracion `202605020001_ai_agents_memory.sql` existe, pero todavia depende de `current_app_role()` y no modela todas las columnas pedidas para staging/produccion controlada.
- `AgentMemory` es in-memory.
- `/api/v1/ai/agents` ya lista/ejecuta agentes y fue extendido para historial, sugerencias, logs y aprobacion/rechazo.
- `/admin/ai-agents` ya consume la API real cuando el flag y auth lo permiten.

## Riesgos antes de tocar codigo

- No exponer `SUPABASE_SERVICE_ROLE_KEY` al frontend.
- No activar el panel ni autonomia peligrosa por defecto.
- Evitar depender de funciones Supabase inexistentes sin fallback.
- Mantener compatibilidad con tests y fallback local.
- No romper los agentes existentes ni duplicarlos.
- No aplicar migraciones contra produccion desde este entorno.

## Archivos probablemente modificados

- `supabase/migrations/202605020001_ai_agents_memory.sql`
- `lib/ai-agents/AgentMemory.js`
- `lib/ai-agents/SupabaseAgentMemory.js`
- `lib/ai-agents/AgentLogger.js`
- `lib/ai-agents/AgentOrchestrator.js`
- `lib/ai-agents/index.js`
- `server/api/v1/ai-agents.js`
- `screens/AdminAIAgentsScreen.js`
- `tests/unit/ai-agents.test.js`
- `tests/integration/ai-agents-api.test.js`
- `tests/unit/supabase-agent-memory.test.js`
- `tests/unit/premium-service.test.js`
- `tests/unit/admin-ai-agents-screen.test.js`
- `docs/SUPABASE_AI_AGENTS_SETUP.md`
- `docs/AI_AGENTS_ARCHITECTURE.md`
- `docs/PRODUCTION_READINESS.md`

## Estrategia de implementacion

1. Endurecer la migracion Supabase con columnas requeridas, estados consistentes, indices y funcion `agent_authorized_role()` basada en `auth.jwt()->app_metadata.role`.
2. Mantener `AgentMemory` como fallback, y crear `SupabaseAgentMemory` solo para servidor.
3. Hacer que el endpoint construya memoria Supabase si hay `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`; si falla, cae a in-memory con warning.
4. Extender endpoint con acciones seguras: `list`, `run`, `runAllSafe`, `history`, `pendingSuggestions`, `logs`, `approveSuggestion`, `rejectSuggestion`.
5. Conectar el panel admin a la API cuando el flag este activo; si no, mostrar bloqueo explicito.
6. Agregar tests unitarios e integration tests de endpoint bloqueado/listado/memoria fallback.
7. Actualizar documentacion operativa y checklist.
8. Corregir bugs puntuales documentados sin refactor masivo: Premium `isPremium`, summary real/fallback y encoding principal pendiente documentado.

## Validaciones finales

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run production:check`
- `npm run test:e2e` si el tiempo/servidor lo permite
