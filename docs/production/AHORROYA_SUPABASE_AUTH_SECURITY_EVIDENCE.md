# AhorroYA Supabase Auth Security Evidence

Date: 2026-05-11

## Status

```text
SUPABASE_AUTH_LEAKED_PASSWORD_PROTECTION=BLOCKED_HUMAN_APPROVAL
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Required Evidence

| Requirement | Source | Owner | Evidence expected | Ready condition |
| --- | --- | --- | --- | --- |
| Production project identified | Supabase Dashboard | Security owner | Production project ref recorded outside repo and matched to release plan | Correct project is confirmed |
| Leaked password protection setting | Supabase Dashboard | Security owner | Redacted screenshot or audit note showing setting enabled | Toggle is enabled, or a signed security exception exists |
| Password policy | Supabase Dashboard | Security owner | Minimum length and character policy recorded | Policy is acceptable for production |
| Plan support | Supabase billing/project settings | Business + Security | Confirmation that project plan supports leaked password protection | Feature is available and enabled |
| Auth smoke | Production release window | QA + Security | Signup/login/reset-password smoke with no secrets in logs | Auth works after setting is enabled |

## Manual Location

Supabase Dashboard:

```text
Project > Authentication > Security or Password Security settings
```

The exact dashboard label can change, so verify against the current Supabase Auth password security documentation.

## Safe Verification Commands

Repo checks:

```powershell
npm run test:rls
npm run production:check
```

Manual dashboard evidence is still required. Do not attempt to modify the production Auth setting from local scripts.

## Risk If Omitted

- Users can register with passwords already present in breach datasets.
- Credential stuffing risk increases.
- Investor/security due diligence remains incomplete.
- Production launch lacks a clear Auth hardening record.

## Source Reference

- Supabase Auth password security: https://supabase.com/docs/guides/auth/password-security

## Ready Condition

Set `SUPABASE_AUTH_LEAKED_PASSWORD_PROTECTION=READY` only when the production dashboard evidence is captured, redacted, owned, and linked in the release evidence folder outside the repository.
