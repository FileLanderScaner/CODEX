# Google Auth staging execution checklist

| Paso | Accion | Evidencia | Estado |
|---|---|---|---|
| 1 | Crear OAuth Client en Google Cloud | Client id | Pendiente |
| 2 | Configurar authorized origins local | `http://localhost:8081` | Pendiente |
| 3 | Configurar authorized origins staging | `https://<staging-domain>` | Pendiente |
| 4 | Dejar preparado origin produccion futuro | `https://<production-domain>` | Pendiente |
| 5 | Configurar redirect URL local | URL configurada | Pendiente |
| 6 | Configurar redirect URL staging | URL configurada | Pendiente |
| 7 | Documentar redirect URL produccion futura | URL pendiente | Pendiente |
| 8 | Activar Google en Supabase Auth Provider | Provider enabled | Pendiente |
| 9 | Cargar client id/secret en Supabase | Captura sin secret visible | Pendiente |
| 10 | Cargar `EXPO_PUBLIC_GOOGLE_CLIENT_ID` en Vercel | Env publica | Pendiente |
| 11 | Cargar `GOOGLE_OAUTH_CLIENT_ID` en Vercel server | Env server | Pendiente |
| 12 | Cargar `GOOGLE_OAUTH_CLIENT_SECRET` en Vercel server | Env server, sin exponer | Pendiente |
| 13 | Probar login staging | Sesion creada | Pendiente |
| 14 | Probar logout staging | Sesion cerrada | Pendiente |
| 15 | Probar migracion de favoritos locales a cloud | Filas `user_favorites` | Pendiente |
| 16 | Probar migracion de alertas locales a cloud | Filas `price_alerts` | Pendiente |
| 17 | Probar usuario sin rol | Sin acceso admin | Pendiente |
| 18 | Probar usuario admin | Acceso admin segun flag/rol | Pendiente |

## Redirect URLs

Local:

```text
http://localhost:8081
```

Staging:

```text
https://<staging-domain>
```

Produccion futura:

```text
https://<production-domain>
```

## Errores comunes

- Redirect URL con slash final cuando el proveedor espera sin slash.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` distinto al configurado en Supabase.
- `GOOGLE_OAUTH_CLIENT_SECRET` cargado como variable publica.
- Supabase provider habilitado en proyecto incorrecto.
- Token viejo sin `app_metadata.role` actualizado; refrescar sesion.
