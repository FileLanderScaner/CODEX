# Secrets and rotation

Nunca poner estos valores en `EXPO_PUBLIC_*`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `CRON_SHARED_SECRET`
- `AFFILIATE_SIGNING_SECRET`

Rotacion recomendada: trimestral para service role y secretos internos; inmediata ante sospecha; PayPal webhook secret al rotar endpoint.
