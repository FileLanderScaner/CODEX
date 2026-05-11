# AhorroYA Premium Feature Matrix

Date: 2026-05-11

## Status

- Premium billing model: PayPal subscription
- Sandbox: ready
- Live: blocked by missing external live credentials
- Production: `NO-GO_PRODUCTION`

## Feature Matrix

| Funcion | Free | Premium | Estado | Falta |
| --- | --- | --- | --- | --- |
| Busqueda de productos | Disponible | Busquedas ilimitadas y sugerencias priorizadas | Ready for first 100 | Definir limite comercial final para Free |
| Comparacion de precios | Disponible | Comparacion completa por comercio/zona | Ready for first 100 | Mejorar cobertura de datos |
| Ahorro estimado | Disponible | Resumen mensual y seguimiento historico | Partial | Dashboard mensual real |
| Alertas de baja de precio | Limitadas/locales | Alertas ilimitadas/sincronizadas | Partial | Politica de limites y notificaciones reales |
| Favoritos | Limitados/locales | Favoritos ilimitados/sincronizados | Partial | Politica de limite Free |
| Historial de precios | Basico | Historial completo y tendencias | Partial | Completar UI historica por producto |
| Carrito inteligente | Basico | Optimizacion avanzada | Partial | Medicion real de conversion |
| Comparacion por zona | Basica | Priorizacion por barrio/zona | Partial | Geolocalizacion/sucursales reales |
| Recomendaciones inteligentes | No disponible | Futuro con IA segura | Blocked | AI Gateway/agentes siguen apagados |
| Ads | Puede ver anuncios | Sin anuncios si se activan ads | Documented | Activar solo si hay proveedor y politica |
| PayPal Premium | Sandbox | Suscripcion PayPal | Sandbox ready | Credenciales live y prueba controlada |

## Premium Entitlement Source

The canonical entitlement source is `/api/v1/billing/me`.

The client must treat a user as premium only when at least one subscription has:

- normalized status `active`; and
- no period end, or a future `current_period_end` / `expires_at` value.

The UI must not trust local demo premium state for real billing. Demo premium is only allowed when PayPal/Supabase configuration is absent.

## Required Feature Flags

| Flag | Production Default | Purpose |
| --- | --- | --- |
| `PAYPAL_ENV` | `sandbox` until live gate passes | Selects sandbox or live PayPal API |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | Required for visible PayPal checkout | Public PayPal client ID |
| `AI_GATEWAY_ENABLED` | `false` | Keeps AI calls disabled |
| `ENABLE_AI_AGENTS` | `false` | Keeps autonomous agents disabled |
| `ENABLE_ADMIN_AI_PANEL` | `false` | Blocks admin AI UI |

## Gating Rules

1. Do not unlock Premium from client-only state after a real PayPal checkout.
2. Do not unlock Premium on `approval_pending`.
3. Unlock Premium only from signed PayPal subscription webhook or trusted server state.
4. Disable Premium on `suspended`, `expired`, or `payment_failed`.
5. For `cancelled`, keep access only if PayPal supplies a future period end.

## Remaining Commercial Work

- Define final public pricing in UYU/USD.
- Decide limits for free search, favorites, and alerts.
- Add revenue dashboard for subscription conversion and churn.
- Add cancellation UX that explains billing source and renewal status.
