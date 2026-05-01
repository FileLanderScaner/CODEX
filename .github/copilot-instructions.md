# AhorroYA — Copilot Instructions

Este repo es una app Expo / React Native Web, no Next.js.

## Reglas
- No usar imports de Next.js salvo que el archivo sea explícitamente Next.
- No romper compatibilidad Expo Web.
- Mantener fallback local con AsyncStorage.
- Mantener Supabase/PayPal como opcionales.
- No eliminar auth demo ni Premium demo.
- No rehacer arquitectura sin necesidad.
- Toda mejora debe pasar:
  - npm run lint
  - npm run typecheck
  - npm run test
  - npm run build

## Stack
- Expo 53
- React 19
- React Native Web
- Vercel para web/API
- Supabase opcional
- PayPal opcional
- AsyncStorage fallback

## Prioridad
Estabilidad > features nuevas.
Producción mínima > perfección.