# Informe total de faltantes para continuar hasta produccion

Fecha: 2026-04-27.

Este documento enumera lo que falta desarrollar, validar o configurar para que otra IA/equipo continue desde el estado actual y lleve AhorroYA a produccion real.

## Estado actual resumido

Ya existe una base productiva inicial:

- App Expo / React Native Web en JavaScript.
- Build web con `expo export`.
- API legacy y nueva API `/api/v1`.
- Configuracion validada con zod.
- Migracion Supabase versionada con RLS.
- Adaptadores iniciales para UAM/MGAP, ODEPA, SIPSA y PROFECO.
- PayPal legacy reutilizado y rutas billing v1.
- Tests unitarios, integracion, contrato, seguridad y E2E smoke.
- CI/CD GitHub Actions y artefactos AWS/GCP/Azure/Netlify.
- Documentacion en `docs/`.

## Bloqueantes externos

1. Repositorio GitHub no conectado localmente.
   - No existe carpeta `.git`.
   - `git` no esta disponible en este entorno.
   - `gh` no esta disponible en este entorno.
   - Falta dato `owner/repo` para usar el conector GitHub por API.

2. Supabase real.
   - Falta confirmar URL/proyecto y ejecutar `supabase/migrations/202604270001_production_schema.sql`.
   - Falta configurar roles en `app_metadata.role`.
   - Falta revisar RLS con usuarios reales.

3. Fuentes oficiales.
   - Falta definir URLs concretas de recurso CSV/Excel/PDF por pais y periodo.
   - Falta confirmar metodo SOAP exacto de SIPSA en WSDL productivo.
   - Falta contrato final con fixtures descargadas de cada fuente oficial.

4. PayPal.
   - Falta crear planes reales mensual/anual de PayPal Subscriptions.
   - Falta mapear webhooks de subscription lifecycle.
   - Falta probar sandbox extremo a extremo.

## Faltantes de desarrollo por area

### Producto y UX

- Crear pantallas reales para admin, b2b, docs y status o separar subproyectos.
- Agregar estado visual de modo degradado cuando Supabase/API no respondan.
- Completar flujos UI de favoritos, alertas y premium contra `/api/v1`.
- Agregar vista de historial de precio por producto con grafica.
- Agregar filtros por pais, moneda, tienda, categoria, region y fecha.
- Agregar etiquetas visibles para sponsored placements.
- Agregar panel de metricas para conversion, churn, MRR, ARPU/ARU e import SLA.

### API

- Conectar completamente la app cliente a `/api/v1` y dejar legacy solo como compatibilidad.
- Implementar paginacion y filtros reales en `products`, `stores`, `categories` y `prices`.
- Agregar esquema OpenAPI generado desde tests o validaciones zod.
- Sustituir rate limit in-memory por Redis/Upstash o Supabase-backed limiter.
- Persistir `audit_logs` desde endpoints sensibles.
- Agregar firma de afiliados con `AFFILIATE_SIGNING_SECRET`.
- Implementar API keys B2B con hash, scopes y medicion de consumo.

### Supabase y datos

- Ejecutar migracion en staging y produccion.
- Agregar seeds de categorias, marcas, productos base y tiendas.
- Crear funciones SQL para upsert idempotente de observaciones y current prices.
- Revisar policies por tabla con pruebas de anon/auth/admin/merchant/internal_job.
- Agregar jobs de limpieza/retencion para `raw_source_payloads`.
- Crear materialized views si el volumen supera views simples.

### Ingesta oficial

- Uruguay UAM/MGAP:
  - Confirmar fuente oficial actual.
  - Priorizar Excel/CSV si esta disponible.
  - Mejorar parser HTML segun estructura real.
  - Mantener PDF solo como fallback documentado.

- Chile ODEPA:
  - Resolver recurso CKAN/CSV especifico.
  - Agregar discovery de paquetes CKAN si la URL base cambia.
  - Separar mayorista diario y consumidor semanal.

- Colombia SIPSA:
  - Confirmar metodo SOAP.
  - Agregar retries con backoff.
  - Normalizar nombres de mercados/departamentos.

- Mexico PROFECO QQP:
  - Agregar selector de periodos.
  - Descargar diccionario de datos y validar columnas.
  - Manejar archivos grandes por streaming si el CSV supera memoria serverless.

### Seguridad

- Configurar `ALLOWED_ORIGINS` exacto por entorno.
- Confirmar que ningun secreto server-only viaje al bundle web.
- Agregar CSP en Vercel cuando se estabilicen dominios PayPal/Supabase.
- Agregar WAF/bot protection si se abre API publica B2B.
- Agregar rotacion documentada y responsables.
- Agregar pruebas automáticas de RLS usando Supabase local.

### Monetizacion

- Crear productos/planes PayPal mensual y anual.
- Implementar upgrade/downgrade real.
- Implementar cancelacion y reactivacion.
- Implementar referrals con recompensa y antifraude.
- Implementar afiliados con tracking firmado y reporte de ingresos.
- Implementar sponsored placements con etiqueta obligatoria.
- Implementar planes B2B/API y cuotas por API key.

### DevOps

- Conectar repo GitHub real.
- Instalar `git` y `gh` o usar conector GitHub con `owner/repo`.
- Configurar environments de GitHub: preview y production.
- Configurar secrets de Vercel, Supabase, PayPal, Expo.
- Ejecutar CI en GitHub real.
- Habilitar deploy preview Vercel for GitHub.
- Habilitar `supabase db push` controlado por ambiente.
- Agregar monitoreo de errores y uptime.

### Testing

- Agregar tests de endpoints con Supabase mock/MSW.
- Agregar contract tests que usen fixtures reales versionadas.
- Agregar E2E de favoritos, alertas y checkout premium sandbox/mock.
- Agregar smoke mobile si se publica Expo dev client.
- Agregar test de migracion SQL en Supabase local.
- Agregar coverage threshold minimo.

## Comandos validados localmente

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run ci
```

Resultado: todos pasan en local.

## Warnings vigentes

- Expo recomienda `@react-native-async-storage/async-storage@2.1.2` y `react-native@0.79.6` para mejor compatibilidad. El build y E2E pasan con las versiones actuales.
- `npm audit --audit-level=high` pasa, pero quedan vulnerabilidades moderadas transitivas en toolchain Expo. No se aplico `npm audit fix --force` porque propone cambios breaking.

## Siguiente iteracion recomendada

1. Conectar GitHub y subir esta base.
2. Ejecutar migracion en Supabase staging.
3. Configurar variables reales en Vercel preview.
4. Conectar cliente a `/api/v1`.
5. Validar una fuente oficial real de punta a punta.
6. Completar PayPal Subscriptions sandbox.
7. Agregar dashboard admin minimo para jobs/reportes/aprobaciones.
