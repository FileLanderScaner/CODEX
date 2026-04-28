# Azure App Service

Usar Node 22, `npm ci`, `npm run build` y servir `dist/` con un servidor estatico. La API serverless de Vercel no se porta automaticamente; para Azure hay que desplegar funciones equivalentes o separar API en Cloud Run/App Service Node.

Variables requeridas: mismas de `.env.example`, cargadas como App Settings.
