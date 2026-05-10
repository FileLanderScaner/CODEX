# Dependency Security Hardening

Fecha: 2026-05-10

## Estado

`DEPENDENCY_AUDIT_STATUS=PASS`

## Hallazgo corregido

`npm audit` reportaba 4 vulnerabilidades moderadas por `postcss <8.5.10` dentro de la cadena Expo/Metro:

- `expo`
- `@expo/cli`
- `@expo/metro-config`
- `postcss`

La recomendacion automatica de npm era `npm audit fix --force`, pero ese camino proponia una version mayor/regresiva de Expo. No se uso `--force`.

## Correccion aplicada

Se agrego un override npm seguro:

```json
{
  "overrides": {
    "postcss": "^8.5.14"
  }
}
```

Motivo:

- La vulnerabilidad estaba en `postcss` 8.x.
- La version corregida disponible tambien es 8.x.
- El override evita downgrade/regresion de Expo.
- `npm install` resolvio `postcss@8.5.14` para Expo/Metro y Vite.

## Evidencia

- `npm audit`: `found 0 vulnerabilities`
- `npm ls postcss @expo/metro-config expo --depth=3`:
  - `expo@53.0.27`
  - `@expo/metro-config@0.20.18`
  - `postcss@8.5.14`
  - `vite@8.0.10` usando `postcss@8.5.14`

## Validaciones posteriores

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run test`: PASS, 89 tests
- `npm run build`: PASS
- `npm run staging:check`: PASS
- `npm run production:check`: PASS tecnico, `mode=staging_ready`
- `npm run test:rls`: PASS, `RLS_SESSION_POOLER_DETECTED`

## Politica futura

- No usar `npm audit fix --force` sin revisar impacto de version mayor.
- Preferir overrides puntuales solo cuando:
  - la dependencia vulnerable mantiene major compatible;
  - la suite completa pasa;
  - build web pasa;
  - no se degrada Expo/React Native;
  - se documenta la decision.
- Revisar el override en el proximo upgrade mayor de Expo.

## Produccion

Esta correccion no habilita produccion por si sola.

`PRODUCTION_STATUS=NO-GO_PRODUCTION`
