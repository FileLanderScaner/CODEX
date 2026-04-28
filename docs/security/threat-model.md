# Threat model

Activos: precios oficiales, contribuciones comunitarias, cuentas, pagos PayPal, roles admin/merchant, API keys B2B.

Controles implementados:

- CORS por allowlist.
- Rate limiting in-memory por IP para serverless.
- RLS en tablas expuestas.
- Secrets server-only fuera de `EXPO_PUBLIC_*`.
- Verificacion de webhook PayPal en ruta legacy y v1.
- Request correlation con `request_id`.
- Auditoria con tabla `audit_logs`.

Riesgos residuales: rate limiting distribuido requiere Redis/Upstash o Supabase-backed limiter; claims de roles deben provisionarse fuera del cliente.
