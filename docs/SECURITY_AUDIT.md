# Security audit

Verificado:

- `vercel.json` define CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy y Permissions-Policy.
- APIs aplican CORS restringible por `ALLOWED_ORIGINS`, rate limit y `no-store`.
- Supabase service role se usa desde servidor, no frontend.
- RLS existe en migraciones principales y se agrego RLS admin para tablas de agentes.
- Panel de agentes queda apagado por defecto con `ENABLE_ADMIN_AI_PANEL=false`.

Riesgos pendientes:

- Confirmar en Supabase real que todas las migraciones estan aplicadas y que `current_app_role()` existe.
- Configurar Upstash para rate limiting persistente en produccion.
- Confirmar webhook PayPal con firma y `PAYPAL_WEBHOOK_ID`.
- Revisar endpoints admin con tokens reales y roles en `app_metadata`.
- Limpiar encoding roto para evitar problemas de confianza/UX.

Variables sensibles que no deben exponerse: `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `TWILIO_AUTH_TOKEN`, `CRON_SHARED_SECRET`, `AFFILIATE_SIGNING_SECRET`.
