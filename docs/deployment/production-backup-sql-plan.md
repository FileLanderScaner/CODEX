# Production SQL backup plan

## Estado

`BACKUP_SQL_STATUS=MANUAL_BLOCKER`

`PRODUCTION_STATUS=NO-GO_PRODUCTION`

No ejecutar deploy production, migraciones production ni cambios de schema production sin backup aprobado y verificable.

## Alcance del backup

Respaldar antes de cualquier cambio production:

- Schema completo de la base production.
- Datos criticos de negocio: perfiles, suscripciones, billing, productos, precios, favoritos, reportes y tablas de agentes si existen.
- Roles, grants, policies RLS, funciones, triggers e indices.
- Configuracion externa relacionada: Vercel Production env por nombres, PayPal live config, Google OAuth production config.

No guardar secretos en el repo. No imprimir connection strings, passwords, service role ni tokens.

## Metodo recomendado

Opcion preferida: Supabase Dashboard production.

1. Confirmar proyecto production correcto.
2. Tomar snapshot/backup desde la seccion de backups del Dashboard.
3. Registrar identificador del backup, timestamp UTC, responsable y alcance.
4. Confirmar que el backup completo aparece como disponible/restaurable.

Opcion CLI solo con aprobacion explicita y entorno seguro:

```powershell
pg_dump --format=custom --no-owner --no-acl --file <secure-backup-path> <PRODUCTION_DB_URL>
```

Reglas para CLI:

- No ejecutar desde esta rama sin aprobacion production.
- No imprimir `<PRODUCTION_DB_URL>`.
- Usar un path seguro fuera del repo.
- Cifrar el backup si se guarda fuera del proveedor.
- Restringir acceso al backup a responsables autorizados.

## Donde guardar

- Preferido: backup administrado por Supabase.
- Alternativo: storage privado corporativo cifrado.
- Prohibido: repo Git, carpeta publica, chat, issue tracker con adjuntos publicos o desktop compartido sin cifrado.

## Aprobacion

Debe aprobar:

- Release Manager.
- Security Engineer.
- Responsable de negocio o owner del sistema.

La aprobacion debe incluir:

- Project ref production.
- Timestamp del backup.
- Alcance.
- Responsable que valido disponibilidad.

## Validacion posterior

Antes de production:

- Confirmar que el backup existe y puede restaurarse.
- Confirmar que no contiene credenciales impresas en logs.
- Confirmar que la retencion cubre la ventana de deploy y rollback.
- Confirmar que el revert plan referencia este backup.

Si no hay backup validado: `PRODUCTION_STATUS=NO-GO_PRODUCTION`.
