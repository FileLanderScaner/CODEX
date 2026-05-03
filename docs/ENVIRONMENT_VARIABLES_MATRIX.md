# Environment variables matrix

| Variable | Tipo | Entorno | Obligatoria | Uso | Riesgo si falta | Se puede exponer al frontend |
|---|---|---|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Publica | Staging/Produccion | Si | Cliente Supabase | Auth/datos cloud no funcionan | Si |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publica | Staging/Produccion | Si | Cliente Supabase anon | Auth/datos cloud no funcionan | Si |
| `EXPO_PUBLIC_API_BASE_URL` | Publica | Staging/Produccion | Si | Llamadas API | Cliente llama URL incorrecta | Si |
| `EXPO_PUBLIC_APP_URL` | Publica | Staging/Produccion | Si | Deep links/share | Links incorrectos | Si |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | Publica | Staging/Produccion | Si para pagos | SDK PayPal web | Checkout no abre | Si |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Publica | Staging/Produccion | Si para Google | OAuth web/mobile | Login Google no inicia | Si |
| `EXPO_PUBLIC_PREMIUM_PRICE` | Publica | Todos | No | UI precio | Precio UI por defecto | Si |
| `EXPO_PUBLIC_PREMIUM_CURRENCY` | Publica | Todos | No | UI moneda | Moneda UI por defecto | Si |
| `SUPABASE_URL` | Privada servidor | Staging/Produccion | Si | REST server/service role | APIs server fallan | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Privada servidor | Staging/Produccion | Si | Writes server/admin | Persistencia/admin fallan | No, prohibido |
| `PAYPAL_ENV` | Privada servidor | Staging/Produccion | Si | sandbox/live | PayPal apunta mal | No |
| `PAYPAL_CLIENT_ID` | Privada servidor | Staging/Produccion | Si para pagos | API PayPal | Subscriptions fallan | No |
| `PAYPAL_CLIENT_SECRET` | Privada servidor | Staging/Produccion | Si para pagos | API PayPal | Subscriptions fallan | No, prohibido |
| `PAYPAL_WEBHOOK_ID` | Privada servidor | Staging/Produccion | Si para pagos | Firma webhook | Webhook no valida | No |
| `PAYPAL_MONTHLY_PLAN_ID` | Privada servidor | Staging/Produccion | Si para Premium | Plan mensual | Checkout falla | No |
| `PAYPAL_YEARLY_PLAN_ID` | Privada servidor | Staging/Produccion | Si para Premium | Plan anual | Checkout falla | No |
| `ALLOWED_ORIGINS` | Privada servidor | Staging/Produccion | Si | CORS | API bloqueada o laxa | No |
| `OPENAI_API_KEY` | Privada servidor | Opcional | No | IA provider | IA usa mock/fallback | No, prohibido |
| `OPENAI_MODEL` | Privada servidor | Opcional | No | Modelo OpenAI | Usa default | No |
| `GEMINI_API_KEY` | Privada servidor | Opcional | No | IA provider | IA usa mock/fallback | No, prohibido |
| `GEMINI_MODEL` | Privada servidor | Opcional | No | Modelo Gemini | Usa default | No |
| `TWILIO_ACCOUNT_SID` | Privada servidor | Opcional | No | WhatsApp Business | Solo deep links | No |
| `TWILIO_AUTH_TOKEN` | Privada servidor | Opcional | No | WhatsApp Business | Solo deep links | No, prohibido |
| `TWILIO_WHATSAPP_NUMBER` | Privada servidor | Opcional | No | WhatsApp Business | Solo deep links | No |
| `CRON_SHARED_SECRET` | Privada servidor | Staging/Produccion | Si para cron | Jobs internos | Cron bloqueado | No |
| `AFFILIATE_SIGNING_SECRET` | Privada servidor | Staging/Produccion | Si para afiliados | Firmas afiliados | Tracking afiliado inseguro | No |
| `AI_PROVIDER` | Privada servidor | Todos | Si | Seleccion IA | Usa default mock | No |
| `AI_AUTONOMY_LEVEL` | Privada servidor | Todos | Si | Nivel autonomia | Puede bloquear ejecuciones | No |
| `ENABLE_AI_AGENTS` | Privada servidor | Todos | Si | Habilita ejecucion | Ejecucion bloqueada | No |
| `ENABLE_AGENT_SCHEDULER` | Privada servidor | Todos | Si | Scheduler | Scheduler apagado | No |
| `ENABLE_ADMIN_AI_PANEL` | Privada servidor | Todos | Si | Panel admin | Panel bloqueado | No |
| `ENABLE_AI_LEVEL4_OVERRIDE` | Privada servidor | Todos | Si | Override nivel 4 | Debe quedar false | No |
