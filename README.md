# AhorroYA

App Expo / React Native para comparar precios de supermercados en Uruguay/LatAm, cargar precios comunitarios, compartir ahorros y vender Premium.

## Funcionalidades actuales

- Busqueda de producto y filtro por barrio.
- Precios reales en Supabase con fallback local.
- Carga comunitaria de precios.
- Productos con marca, unidad, categoria y confianza.
- Precio mas barato destacado, promedio, tendencia y ahorro.
- Favoritos locales y cloud.
- Alertas cloud para usuarios logueados.
- Login social con Supabase OAuth: Google y Facebook.
- Share viral, WhatsApp, copiar texto e invitar amigo.
- Reporte de precio incorrecto.
- Puntos, ranking y badge de contribuidor.
- Links recomendados por producto.
- Tracking de clicks comerciales.
- PayPal Live para Premium.
- Eventos de monetizacion en Supabase.

## Correr local

```powershell
cd C:\codex
npm.cmd install
npm.cmd run web
```

## Produccion

Web:

```text
https://project-6vgnm.vercel.app
```

Build:

```powershell
npm.cmd run build
```

Deploy:

```powershell
npx.cmd vercel deploy --prod --yes
```

## Monetizacion

- Premium con PayPal Live.
- Tracking de clicks en Premium.
- Links recomendados por producto.
- Tracking de clicks comerciales.
- Base lista para patrocinados, afiliados y panel B2B.

## Proximo crecimiento

- Configurar Google/Facebook providers en Supabase con claves reales.
- Agregar AdMob real en mobile.
- Crear panel admin para comercios.
- Agregar referidos con recompensa.
- Agregar scraping/API de catalogos autorizados.
- Convertir alertas cloud en push notifications.
