# AhorroYA Vercel Production Env Checklist

Date: 2026-05-11

## Status

```text
VERCEL_PRODUCTION_ENV_STATUS=BLOCKED_EXTERNAL_CREDENTIALS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Scope

This checklist verifies that Vercel Production has the real values required for a production launch. It must not print values and must not mutate envs until there is explicit approval.

## Required Production Env Names

Public values:

```text
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_APP_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_PAYPAL_CLIENT_ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID
```

Server-only values:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ALLOWED_ORIGINS
PAYPAL_ENV
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_MONTHLY_PLAN_ID
PAYPAL_YEARLY_PLAN_ID
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
AI_PROVIDER
AI_GATEWAY_ENABLED
ENABLE_AI_AGENTS
AI_AUTONOMY_LEVEL
ENABLE_ADMIN_AI_PANEL
ENABLE_AI_LEVEL4_OVERRIDE
AI_KILL_SWITCH
```

## Required Safe Values

```text
PAYPAL_ENV=live
AI_PROVIDER=mock
AI_GATEWAY_ENABLED=false
ENABLE_AI_AGENTS=false
AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY
ENABLE_ADMIN_AI_PANEL=false
ENABLE_AI_LEVEL4_OVERRIDE=false
AI_KILL_SWITCH=true
```

`PAYPAL_ENV=live` is allowed only after PayPal live credentials, webhook, and controlled subscription evidence are ready.

## Safe Read-Only Verification

Human operator can list env names without printing values:

```powershell
npx vercel env ls production --scope akuma424-projects --no-color
```

If exporting JSON, store it outside the repo and redact values if any tool includes them.

Repo-safe checks after secure env injection:

```powershell
npm run production:check
```

Do not run:

```powershell
vercel env add <name> production
vercel env rm <name> production
npx vercel deploy --prod
npx vercel promote
```

until production approval exists.

## Evidence Expected

```text
Vercel project:
Team/scope:
Production env inventory captured at UTC:
Captured by:
All required names present: yes/no
No secret values printed: yes/no
Public env names reviewed for secret-like names: yes/no
AI agents disabled: yes/no
PayPal live evidence linked: yes/no
Google OAuth evidence linked: yes/no
Approver:
```

## Risk If Omitted

- Production can launch with staging or sandbox credentials.
- Secrets can be exposed through public env variables.
- AI agents can be enabled accidentally.
- PayPal live can be miswired.

## Ready Condition

Set `VERCEL_PRODUCTION_ENV_STATUS=READY` only when all required names exist with real non-placeholder values, public values are safe, production owner attests values are correct, and no secrets are printed.
