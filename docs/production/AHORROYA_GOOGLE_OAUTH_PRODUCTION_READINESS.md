# AhorroYA Google OAuth Production Readiness Evidence

Date: 2026-05-11

## Status

```text
GOOGLE_OAUTH_PRODUCTION_STATUS=BLOCKED_EXTERNAL_CREDENTIALS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## External Evidence Required

| Requirement | Source | Owner | Evidence expected | Ready condition |
| --- | --- | --- | --- | --- |
| Production OAuth client | Google Cloud Console | Auth owner | OAuth client id recorded outside repo; secret stored only in secret store | Client exists for the production domain |
| Authorized redirect URIs | Google Cloud Console | Auth owner | Redacted screenshot/list of exact production redirect URIs | Redirects exactly match app/Supabase callback URLs |
| Supabase Google provider | Supabase Dashboard | Auth owner | Provider enabled with production client id; secret not shown | Supabase Auth Google provider uses production credentials |
| Login smoke | Production release window | QA + Auth owner | Login/signup succeeds, profile created, logout works | Google login works on production domain |

## Required Env Names

```text
EXPO_PUBLIC_GOOGLE_CLIENT_ID
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
```

`GOOGLE_OAUTH_CLIENT_SECRET` must never be public and must never be committed.

## Redirect URI Requirements

Google requires redirect URIs for web applications to match the configured authorized redirect URI. Production redirect URIs must use HTTPS and must not contain wildcards, fragments, userinfo, path traversal, or URL-shortener domains.

Expected production entries must be derived from the final production domain and Supabase Auth callback configuration. Do not infer readiness from staging redirects.

## Safe Verification

Manual checks:

```text
Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs
Supabase Dashboard > Authentication > Providers > Google
```

Repo-safe checks:

```powershell
npm run production:check
```

Do not print OAuth secrets.

## Risk If Omitted

- Users cannot sign in with Google in production.
- `redirect_uri_mismatch` blocks auth.
- A staging client can accidentally be used in production.
- OAuth secret can leak if placed in a public env var.

## Source Reference

- Google OAuth web server apps and redirect URI validation: https://developers.google.com/identity/protocols/oauth2/web-server

## Ready Condition

Set `GOOGLE_OAUTH_PRODUCTION_STATUS=READY` only after production OAuth client, exact redirects, Supabase provider config, and production-domain login smoke are verified with secrets redacted.
