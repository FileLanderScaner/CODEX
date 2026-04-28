# Vercel checklist

- Conectar repo a Vercel for GitHub.
- Configurar dominios `app`, `api`, `admin`, `b2b`, `docs`, `status` o wildcard.
- Cargar variables de `.env.example` sin secretos en `EXPO_PUBLIC_*`.
- Ejecutar `supabase db push` antes de activar imports.
- Configurar `CRON_SHARED_SECRET` y enviarlo en jobs internos si se usa Supabase Cron.
- Validar `/api/v1/health` y `/api/v1/readiness`.
