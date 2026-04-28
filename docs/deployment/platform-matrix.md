# Platform matrix

| Plataforma | Estado | Uso recomendado |
| --- | --- | --- |
| Vercel | Principal | Expo export + Serverless Functions + Cron alternativo |
| Supabase | Principal | Postgres, Auth, RLS, REST y cron/edge recomendado para ingesta |
| AWS Amplify | Artefacto listo | Hosting alternativo del build web |
| GCP Cloud Run | Artefacto listo | Contenedor para API/web si se separa de Vercel |
| Azure App Service | Artefacto listo | Hosting Node alternativo |
| Netlify | Artefacto listo | SPA + funciones si se migra la API |

Target primario: Vercel + Supabase. Las alternativas no deben romper `vercel.json`.
