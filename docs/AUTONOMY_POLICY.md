# Politica de autonomia IA

Nivel por defecto: `LEVEL_0_READ_ONLY`.

Niveles:

- `LEVEL_0_READ_ONLY`: analiza y reporta.
- `LEVEL_1_SUGGEST`: propone cambios o tareas.
- `LEVEL_2_SAFE_AUTOMATION`: ejecuta tareas seguras como reportes, clasificacion y recomendaciones.
- `LEVEL_3_CODE_PROPOSAL`: propone parches, no modifica produccion.
- `LEVEL_4_CONTROLLED_EXECUTION`: bloqueado por defecto. Solo podria evaluarse si `ENABLE_AI_LEVEL4_OVERRIDE=true`, con dry-run previo, tests, lint, seguridad y aprobacion humana.

Nunca permitido por defecto:

- Borrar datos de produccion.
- Modificar credenciales.
- Tocar pagos reales.
- Enviar mensajes masivos externos.
- Publicar contenido externo sin revision.
- Cambiar precios manualmente sin fuente.
- Manipular datos de usuarios sin auditoria.
- Ejecutar codigo remoto no validado.

Autoaplicacion permitida solo si el riesgo es bajo, corre en dry-run o entorno controlado, no toca secretos/pagos/datos productivos, y QARegressionAgent + SecurityComplianceAgent pasan.
