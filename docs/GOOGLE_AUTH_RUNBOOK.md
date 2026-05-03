# Google Auth runbook

## Variables

Publicas:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
```

Servidor:

```env
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
```

## Redirect URLs

Local:

```text
http://localhost:8081
```

Staging:

```text
https://<staging-domain>
```

Produccion:

```text
https://<production-domain>
```

## Supabase

1. Ir a Authentication > Providers > Google.
2. Activar Google.
3. Configurar client ID y secret.
4. Agregar redirects del proyecto.

## Validacion

- Login Google crea sesion.
- `profiles` se crea/actualiza.
- Favoritos locales migran a `user_favorites`.
- Alertas locales migran a `price_alerts`.
- Logout limpia sesion.

## Errores comunes

- Redirect URL no coincide.
- Client ID publico distinto del configurado en Supabase.
- Secret backend pegado por error en variable publica.
