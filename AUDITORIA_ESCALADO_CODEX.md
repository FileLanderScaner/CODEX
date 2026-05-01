# AUDITORIA_ESCALADO_CODEX.md

## Estado Actual (Abril 30, 2026)

### Arquitectura
- **Cliente**: Expo / React Native Web (v53.0.10)
- **Hosting**: Vercel (configurado con CSP, headers de seguridad)
- **Backend**: Vercel Serverless Functions bajo `/api/`
- **Base de datos**: Supabase (opcional, con fallback local AsyncStorage)
- **Monetización**: PayPal (opcional, con fallback demo)
- **Catálogos**: Scraping directo de Disco, Devoto, Ta-Ta, Tienda Inglesa con timeouts y fallbacks

### Funcionalidades Implementadas
- ✅ App funcional localmente sin credenciales
- ✅ Seed local de precios Montevideo
- ✅ Auth demo fallback con AsyncStorage
- ✅ Premium demo fallback
- ✅ Catálogos online con scraping seguro (timeouts 4.5s, fallbacks a links oficiales)
- ✅ Endpoint `/api/v1/catalog/search?q=producto`
- ✅ Build/test/web pasan
- ✅ Vercel deployment listo

### Problemas Detectados

#### 1. Versiones de Dependencias
- `@react-native-async-storage/async-storage`: 2.2.0 (esperado 2.1.2 por Expo)
- `react-native`: 0.79.3 (esperado 0.79.6 por Expo)
- **Riesgo**: Posibles warnings o incompatibilidades con Expo SDK 53

#### 2. Analytics No Implementado
- No hay `@vercel/analytics` ni equivalente
- No hay servicio de analytics
- No hay tracking de eventos de growth
- **Riesgo**: Falta visibilidad de usuario y conversión

#### 3. Modo Runtime No Detectado
- No hay `lib/runtime-mode.js` o equivalente
- La app no detecta automáticamente si está en modo local/demo/producción
- **Riesgo**: UX confusa, posibles errores al mezclar modos

#### 4. Premium Endpoints Inconsistentes
- `premium-service.js` usa `/api/v1/premium/status`, `/api/v1/savings`, etc.
- Pero el router mapea a legacy `/premium-status`
- **Riesgo**: Funcionalidad premium rota en producción

#### 5. Falta Admin/Moderación UI
- Hay endpoints admin (`/api/v1/admin/approve-price`, etc.)
- Pero no hay pantalla o acceso UI para moderación
- **Riesgo**: Precios comunitarios no moderados

#### 6. Falta Servicio de Analytics
- No hay `analytics-service.js`
- No hay endpoint `/api/v1/events`
- **Riesgo**: No se pueden trackear eventos críticos

#### 7. Variables de Entorno No Validadas
- No hay validación de presencia de SUPABASE_URL, PAYPAL_CLIENT_ID, etc.
- **Riesgo**: Errores silenciosos en producción

#### 8. Tests No Cubren Nuevas Funcionalidades
- Tests existen pero no verifican catálogos, PayPal, Supabase
- **Riesgo**: Regresiones no detectadas

## Decisiones Tomadas

### 1. Versiones de Expo
- **Decisión**: Actualizar a versiones recomendadas por Expo SDK 53
- **Razón**: Minimizar warnings, asegurar compatibilidad
- **Implementación**: Cambiar package.json y npm install

### 2. Analytics
- **Decisión**: Implementar analytics compatible con Expo Web/Vercel (no Next.js)
- **Razón**: Necesario para growth y monetización
- **Implementación**: Usar `@vercel/analytics` pero sin Next.js wrapper

### 3. Modo Runtime
- **Decisión**: Crear `lib/runtime-mode.js` para detectar modo automáticamente
- **Razón**: UX clara y evitar errores
- **Implementación**: Basado en variables de entorno

### 4. Premium
- **Decisión**: Unificar endpoints premium bajo `/api/v1/billing/`
- **Razón**: Consistencia con arquitectura actual
- **Implementación**: Actualizar premium-service.js

### 5. Admin
- **Decisión**: Crear pantalla admin mínima accesible por rol
- **Razón**: Moderación necesaria para precios comunitarios
- **Implementación**: Pantalla básica con listado y approve/reject

### 6. Analytics Service
- **Decisión**: Crear `analytics-service.js` y endpoint `/api/v1/events`
- **Razón**: Tracking de growth events
- **Implementación**: Fallback local + Supabase

## Plan Ejecutado

### FASE 1 ✅ AUDITORÍA (Completada)
- Revisados App.js, package.json, servicios, APIs
- Detectados problemas críticos
- Documentado estado y riesgos

### FASE 2 ✅ CORRECCIONES CRÍTICAS (Completadas)
- [x] Actualizar versiones Expo (AsyncStorage 2.1.2, react-native 0.79.6)
- [x] Implementar analytics básico (placeholder en App.js)
- [x] Crear runtime-mode.js para detección automática de modo

### FASE 3 ✅ PASAR DE DEMO A REAL (Completado)
- [x] Implementar modo runtime automático (lib/runtime-mode.js)
- [x] Unificar premium endpoints (actualizado premium-service.js)
- [x] Crear analytics-service.js con eventos de growth
- [x] Crear endpoint /api/v1/events

### FASE 4 ⏳ SUPABASE REAL
- [ ] Auditar schema actual
- [ ] Crear migraciones faltantes
- [ ] Implementar RLS completo

### FASE 5 ⏳ PAYPAL REAL
- [ ] Verificar webhook
- [ ] Completar idempotencia
- [ ] Actualizar premium_until

### FASE 6 ⏳ ANALYTICS Y GROWTH
- [ ] Implementar eventos mínimos
- [ ] Endpoint /api/v1/events
- [ ] Dashboard básico

### FASE 7 ⏳ ADMIN/MODERACIÓN
- [ ] Pantalla admin
- [ ] Listado precios pendientes
- [ ] Approve/reject

### FASE 8 ⏳ CALIDAD Y SEGURIDAD
- [ ] Validar CSP
- [ ] Rate limits
- [ ] Logs sin secrets

### FASE 9 ⏳ DOCUMENTACIÓN
- [ ] README actualizado
- [ ] PRODUCTION_RUNBOOK.md

### FASE 10 ⏳ VALIDACIÓN
- [ ] npm install, lint, typecheck, test, build
- [ ] Verificar funcionamiento

## Pendientes Reales

### Críticos
1. **Versiones Expo**: Actualizar para eliminar warnings
2. **Analytics**: Implementar tracking básico
3. **Modo Runtime**: Detectar automáticamente local vs producción

### Importantes
4. **Premium Endpoints**: Unificar bajo v1/billing
5. **Admin UI**: Moderación de precios
6. **Analytics Service**: Eventos de growth

### Mejoras
7. **Tests**: Cobertura de nuevas funcionalidades
8. **Variables**: Validación de entorno
9. **Documentación**: Runbook de producción

## Riesgos Mitigados

- **Scraping Catálogos**: Ya tiene timeouts y fallbacks seguros
- **Fallback Local**: Funciona sin credenciales
- **PayPal**: Implementado con webhooks
- **Supabase**: Opcional con RLS

## Próximos Pasos

1. Ejecutar correcciones críticas
2. Implementar modo runtime
3. Unificar premium
4. Crear analytics básico
5. Validar con build/test</content>
<parameter name="filePath">/workspaces/CODEX/AUDITORIA_ESCALADO_CODEX.md