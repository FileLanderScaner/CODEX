# Supabase Auth production gate

## Estado

`SUPABASE_AUTH_LEAKED_PASSWORD_PROTECTION=MANUAL_BLOCKER`

`PRODUCTION_STATUS=NO-GO_PRODUCTION`

Este gate debe resolverse manualmente en Supabase Dashboard antes de habilitar production. No hay evidencia en el repo que permita afirmar que leaked password protection esta activo en el proyecto production.

## Ubicacion manual

Revisar en Supabase Dashboard:

1. Abrir el proyecto Supabase production.
2. Ir a Authentication/Auth.
3. Abrir password security o password settings.
4. Revisar la opcion para prevenir passwords filtradas/leaked passwords.
5. Activarla si el plan del proyecto lo permite.
6. Registrar evidencia interna: fecha, responsable, project ref production y captura/redaccion del estado.

Segun la documentacion oficial de Supabase, leaked password protection usa HaveIBeenPwned Pwned Passwords y esta disponible en planes Pro o superiores.

## Reglas

- No asumir que esta activo sin evidencia del Dashboard.
- No intentar modificar este toggle desde scripts locales.
- No imprimir project secrets, service role, passwords ni tokens.
- No usar production para pruebas destructivas.
- No desbloquear production si el toggle no existe, no esta disponible por plan o no hay evidencia.

## Criterio de aceptacion

Production puede avanzar solo si:

- Leaked password protection esta activado o existe excepcion de riesgo aprobada por responsable de seguridad.
- La evidencia queda registrada fuera del repo con secretos redaccionados.
- `docs/PRODUCTION_GO_NO_GO.md` se actualiza con el resultado manual.

Si falta evidencia: `PRODUCTION_STATUS=NO-GO_PRODUCTION`.
