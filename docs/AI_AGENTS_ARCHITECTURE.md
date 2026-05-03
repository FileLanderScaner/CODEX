# Arquitectura de agentes IA

La capa vive en `lib/ai-agents` y corre del lado servidor. No expone claves privadas al frontend.

Componentes:

- `AgentOrchestrator`: ejecuta agentes por nombre o `runAllSafeAgents()`.
- `BaseAgent`: contrato base de ejecucion.
- `AgentMemory`: memoria in-memory y contrato para persistencia.
- `AgentTaskQueue`: cola simple de tareas sugeridas.
- `AgentLogger`: logs estructurados.
- `AgentPermissions`: niveles de autonomia y bloqueo de acciones peligrosas.
- `AgentScheduler`: plan diario/semanal/deploy.
- `AgentEvaluation`: evaluacion basica de riesgo.
- `AgentRegistry`: registro de agentes disponibles.
- `AgentToolbox`: herramientas seguras sobre precios, ahorro y carrito.
- `AIProvider`: interfaz abstracta con mock provider por defecto.

Agentes implementados: ProductAuditAgent, PriceIntelligenceAgent, SavingsOptimizerAgent, PersonalizationAgent, GrowthAgent, MonetizationAgent, SupportWhatsAppAgent, DataIngestionAgent, QARegressionAgent, DevAutonomyAgent, SecurityComplianceAgent y ObservabilityAgent.

Endpoint: `POST /api/v1/ai/agents`, bloqueado si `ENABLE_ADMIN_AI_PANEL=false` y protegido por rol admin/internal_job.

Persistencia: `SupabaseAgentMemory` usa `SUPABASE_SERVICE_ROLE_KEY` solo del lado servidor y cae a `AgentMemory` in-memory si falta configuracion. La migracion `supabase/migrations/202605020001_ai_agents_memory.sql` crea `agent_tasks`, `agent_logs`, `agent_reports`, `agent_suggestions`, `agent_memory` y `agent_executions` con RLS para `admin` e `internal_job`.

Acciones del endpoint:

- `list`
- `run`
- `runAllSafe`
- `history`
- `pendingSuggestions`
- `suggestions`
- `logs`
- `reports`
- `approveSuggestion`
- `rejectSuggestion`

`LEVEL_4_CONTROLLED_EXECUTION` queda bloqueado salvo `ENABLE_AI_LEVEL4_OVERRIDE=true`.
