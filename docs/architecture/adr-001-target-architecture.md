# ADR 001: arquitectura objetivo

Estado: aceptado.

## Decision

AhorroYA usa Expo / React Native Web como cliente, Vercel como hosting principal y capa serverless, Supabase como base transaccional/Auth/RLS, PayPal para monetizacion y un modo degradado local basado en mock data + AsyncStorage.

## Dominios

- `app.<dominio>`: SPA Expo Web.
- `api.<dominio>`: funciones `/api/v1`.
- `admin.<dominio>`: panel operativo, por ahora misma app con roles.
- `b2b.<dominio>`: portal API/merchant.
- `docs.<dominio>`: documentacion publica.
- `status.<dominio>`: estado operativo.

En Vercel se pueden mapear con wildcard `*.dominio` al mismo proyecto y rewrites por hostname, o separar proyectos cuando admin/docs/status maduren.

## Datos

Las fuentes oficiales se ingieren como payload crudo, se normalizan a `price_observations`, se consolidan en `price_current` y se exponen via API. Las contribuciones comunitarias siguen en `prices` con moderacion.

## Degradacion

Si Supabase o API no estan configurados, la app muestra estado vacio/error operativo. No existe fallback local de precios.
