# Vercel staging environment checklist

| Variable | Tipo | Fuente | Valor esperado / ejemplo | Obligatoria staging | Riesgo si falta | Validacion |
|---|---|---|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Publica | Supabase staging | `https://<project>.supabase.co` | Si | Cliente no conecta a Supabase | `production:check` supabase_public |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publica | Supabase staging | anon/publishable key | Si | Auth cloud no funciona | Login Google |
| `EXPO_PUBLIC_API_BASE_URL` | Publica | Vercel staging | `https://<staging>.vercel.app` | Si | Cliente llama API incorrecta | Buscar `leche` |
| `EXPO_PUBLIC_APP_URL` | Publica | Vercel staging | `https://<staging>.vercel.app` | Si | Share/deep links rotos | WhatsApp share |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | Publica | PayPal sandbox | sandbox client id publico | Si | Checkout no abre | Smoke premium |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Publica | Google Cloud | OAuth client id web | Si | Login Google no inicia | Login Google |
| `EXPO_PUBLIC_PREMIUM_PRICE` | Publica | Producto | `4.99` | No | UI usa default | Pantalla premium |
| `EXPO_PUBLIC_PREMIUM_CURRENCY` | Publica | Producto | `USD` | No | UI usa default | Pantalla premium |
| `SUPABASE_URL` | Servidor | Supabase staging | `https://<project>.supabase.co` | Si | APIs server fallan | `production:check` supabase_server |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor secreto | Supabase staging | service role key | Si | Writes/admin fallan | Solo Vercel server env |
| `PAYPAL_ENV` | Servidor | PayPal | `sandbox` | Si | Puede apuntar a live por error | `staging:check` |
| `PAYPAL_CLIENT_ID` | Servidor secreto | PayPal sandbox | sandbox server client id | Si | API PayPal falla | Crear suscripcion |
| `PAYPAL_CLIENT_SECRET` | Servidor secreto | PayPal sandbox | sandbox secret | Si | API PayPal falla | Crear suscripcion |
| `PAYPAL_WEBHOOK_ID` | Servidor secreto | PayPal sandbox | webhook id | Si | Webhook no valida firma | Evento webhook |
| `PAYPAL_MONTHLY_PLAN_ID` | Servidor | PayPal sandbox | `P-...` | Si | Plan mensual falla | Compra mensual |
| `PAYPAL_YEARLY_PLAN_ID` | Servidor | PayPal sandbox | `P-...` | Si | Plan anual falla | Compra anual |
| `ALLOWED_ORIGINS` | Servidor | Vercel | `https://<staging>.vercel.app,http://localhost:8081` | Si | CORS laxo o bloqueado | curl readiness con Origin |
| `GOOGLE_OAUTH_CLIENT_ID` | Servidor secreto | Google Cloud | OAuth client id | Si | Supabase provider incompleto | Login Google |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Servidor secreto | Google Cloud | OAuth secret | Si | Supabase provider incompleto | Login Google |
| `AI_PROVIDER` | Servidor | Config | `mock` | Si | IA puede usar proveedor real | `production:check` |
| `AI_AUTONOMY_LEVEL` | Servidor | Config | `LEVEL_0_READ_ONLY` | Si | Autonomia excesiva | `staging:check` |
| `ENABLE_AI_AGENTS` | Servidor | Config | `false` | Si | Ejecuciones IA activas | Panel bloqueado |
| `ENABLE_AGENT_SCHEDULER` | Servidor | Config | `false` | Si | Jobs no aprobados | Env review |
| `ENABLE_ADMIN_AI_PANEL` | Servidor | Config | `false` | Si | Panel visible sin prueba | Panel bloqueado |
| `ENABLE_AI_LEVEL4_OVERRIDE` | Servidor | Config | `false` | Si | Level 4 habilitable | `staging:check` |
| `OPENAI_API_KEY` | Servidor secreto | OpenAI | vacio o key real controlada | No | IA usa mock | Env review |
| `OPENAI_MODEL` | Servidor | OpenAI | `gpt-4.1-mini` | No | Usa default | Env review |
| `GEMINI_API_KEY` | Servidor secreto | Google AI | vacio o key real controlada | No | IA usa mock | Env review |
| `GEMINI_MODEL` | Servidor | Google AI | `gemini-2.5-flash` | No | Usa default | Env review |
| `TWILIO_ACCOUNT_SID` | Servidor secreto | Twilio | SID sandbox/prod futura | No | WhatsApp API no disponible | Deep link fallback |
| `TWILIO_AUTH_TOKEN` | Servidor secreto | Twilio | token secreto | No | WhatsApp API no disponible | Deep link fallback |
| `TWILIO_WHATSAPP_NUMBER` | Servidor | Twilio | `whatsapp:+...` | No | WhatsApp API no disponible | Deep link fallback |
| `CRON_SHARED_SECRET` | Servidor secreto | Generado | valor random largo | No | Cron bloqueado | No activar scheduler |
| `AFFILIATE_SIGNING_SECRET` | Servidor secreto | Generado | valor random largo | No | Afiliados no firman | Flujo afiliados |

Nunca cargar `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY` o tokens privados como `EXPO_PUBLIC_*`.
