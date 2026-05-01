# AhorroYA

Comparador de precios para supermercados de Montevideo con busqueda, favoritos, alertas, carga comunitaria de precios, autenticacion y Premium.

**Estado**: ✅ Auditado y listo para producción (2026-04-30)

## Ejecutar en 1 comando

```powershell
cd C:\CODEX; npm install; npm run web
```

Luego abrir:

```text
http://localhost:8081
```

## Que funciona

- Frontend Expo Web / React Native con navegacion completa: inicio, busqueda, alertas, favoritos, perfil, detalle, QR, configuracion y Premium.
- Datos persistentes locales con `AsyncStorage`.
- Seed util de precios para Montevideo si no hay API/Supabase disponible.
- Busqueda unificada de catalogos online para Disco, Devoto, Ta-Ta y Tienda Inglesa.
- Links directos a catalogos oficiales por producto desde cada busqueda.
- Backend serverless listo para Vercel en `/api`.
- Supabase real cuando existen `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Autenticacion fallback con usuario demo local cuando faltan credenciales.
- PayPal real cuando existe `EXPO_PUBLIC_PAYPAL_CLIENT_ID`.
- Premium fallback con checkout simulado cuando faltan credenciales PayPal.

## Scripts

```powershell
npm run web      # levanta la app web
npm run build    # export web para Vercel
npm run test     # suite Vitest
npm run ci       # lint, typecheck, tests y build
```

## Variables opcionales

Crear `.env` desde `.env.example` si se quieren servicios reales:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PAYPAL_CLIENT_ID=
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_APP_URL=
EXPO_PUBLIC_PREMIUM_PRICE=4.99
EXPO_PUBLIC_PREMIUM_CURRENCY=USD
```

Sin estas variables, la app no se bloquea: usa datos seed, sesion demo local, persistencia local y Premium simulado.

## Google OAuth (opcional)

Este proyecto soporta iniciar sesión con Google. Para configurar OAuth de Google de forma segura:

1. En Google Cloud Console, crea unas credenciales OAuth 2.0 (Tipo: "ID de cliente de OAuth" → "Aplicación web").
2. Añade los Authorized redirect URIs apropiados para tu entorno:
   - Desarrollo local (web): `http://localhost:8081` (o tu URL de desarrollo)
   - Producción (Vercel): `https://<tu-dominio>.vercel.app` o la ruta de callback de tu API si corresponde
3. Descarga el archivo JSON de credenciales (client_secret_*.json). Mantén este archivo fuera del repositorio.
4. Añade las variables al `.env` o como secretos de Vercel / GitHub:
   - EXPO_PUBLIC_GOOGLE_CLIENT_ID (público, usado por el cliente web/mobile)
   - GOOGLE_OAUTH_CLIENT_ID (servidor)
   - GOOGLE_OAUTH_CLIENT_SECRET (servidor)
   - Opcional: GOOGLE_OAUTH_JSON_PATH si prefieres apuntar al JSON local (no subirlo al repo)

Notas de seguridad:
- No subir `client_secret_*.json` al repositorio. Está en `.gitignore` por defecto.
- En Vercel, configurar las variables de entorno en Settings → Environment Variables.
- Si necesitas el JSON en el servidor, añade su contenido como variable de entorno segura (p. ej. `GOOGLE_OAUTH_JSON_BASE64`) y decodifícala en tiempo de despliegue.

Ejemplo (Windows PowerShell) para crear base64:
```powershell
Get-Content .\client_secret.json -Raw | Out-File -Encoding byte -FilePath tmp.bin; [Convert]::ToBase64String([IO.File]::ReadAllBytes('tmp.bin'))
```

Luego pega el resultado en la variable de entorno segura.

Para más detalles sobre la integración concreta (redirect URIs y endpoints), consulta la sección de autenticación en el código fuente o contacta al equipo de backend.


## Catalogos online

La busqueda combina tres fuentes:

1. Precios persistidos en Supabase o fallback local.
2. Endpoint `/api/v1/catalog/search?q=producto`, que intenta leer catalogos online por comercio.
3. Links directos a los catalogos oficiales si un sitio bloquea scraping, cambia HTML o no expone precio estructurado.

Los conectores actuales estan en `services/catalog-service.js`:

- Disco: `https://www.disco.com.uy`
- Devoto: `https://www.devoto.com.uy`
- Ta-Ta: `https://www.tata.com.uy`
- Tienda Inglesa: `https://www.tiendainglesa.com.uy`

## Deploy en Vercel

El proyecto incluye `vercel.json`.

```powershell
npm run build
npx vercel deploy --prod
```

Vercel debe usar:

- Build command: `npm run build`
- Output directory: `dist`

## Auditoría y Cambios Recientes

Ver `AUDITORIA_COPILOT.md` y `CHANGELOG_COPILOT.md` para detalles sobre:
- Correcciones de compatibilidad Expo
- Limpieza de dependencias
- Verificación de robustez de catálogos
- Validaciones de seguridad en Vercel
