# Secrets and rotation

Nunca poner estos valores en `EXPO_PUBLIC_*`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `CRON_SHARED_SECRET`
- `AFFILIATE_SIGNING_SECRET`
- `UPSTASH_REDIS_REST_TOKEN`

Variables publicas permitidas:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`

Rotacion recomendada: trimestral para service role y secretos internos; inmediata ante sospecha; PayPal webhook secret al rotar endpoint.

Rate limiting:

- `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` son obligatorias en produccion.
- Si faltan, la API responde `rate_limit_not_configured` para fallar cerrada.
