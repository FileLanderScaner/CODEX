# Project Autonomous Context

Project: AhorroYA

Date: 2026-05-11

## What This Project Is

AhorroYA is a Uruguay/LATAM savings product that helps users compare supermarket prices, find estimated savings, share savings by WhatsApp, save favorites, create alerts, and eventually monetize through Premium subscriptions.

## Prompt OS Source

The operating model was refreshed from `C:\Users\micahael\Downloads\AhorroYA_Prompt_OS_Autonomo.pdf`.

The document defines a Director-led autonomous workflow:

1. Inspect current repository state.
2. Select the highest-impact safe mode.
3. Execute.
4. Validate.
5. Document.
6. Commit and push safe changes.
7. Generate `NEXT_CODEX_PROMPT`.
8. Continue automatically unless blocked by external credentials, missing access, destructive risk, payment provider action, DNS/OAuth console action, or security risk.

## Repository State

- Branch: `codex/preprod-hardening-auth-paypal`
- Latest verified commit before this context update: `21bbd8db58345669f1cb2a2f390f87f9abddeb4c`
- Remote: `AhorroYa/codex/preprod-hardening-auth-paypal`
- Production: untouched and blocked.

## Stack

- Frontend: Expo/React Native Web.
- Backend/API: Node serverless-style handlers.
- Database/Auth: Supabase.
- Payments: PayPal sandbox subscription flow.
- Deploy: Vercel Preview/Staging.
- AI: Gateway and agents disabled by default.

## Current Product Status

- Staging: `READY_FOR_FIRST_100_USERS`
- Production: `NO-GO_PRODUCTION`
- Growth: ready for first tester loop.
- Premium: sandbox-ready, live blocked.
- Tracking: internal API with local fallback.
- WhatsApp viral loop: ready.
- RLS: pass with Session Pooler.
- AI agents: disabled and kill-switch protected.

## Security Gates

Never do these unless production gate is `PASS_PRODUCTION_READY`:

- `vercel --prod`
- `vercel promote`
- Production env mutation
- Production migration
- PayPal live activation
- Destructive SQL
- RLS disablement
- Secret printing
- `.env` commit
- Autonomous AI agent production activation

## External Blockers

- PayPal live credentials and webhook evidence.
- Controlled PayPal live subscription test.
- Google OAuth production verification.
- Supabase Auth leaked password protection evidence.
- Production backup execution evidence.
- Production revert drill evidence.
- Production release window/owner.

## Definition Of Done

AhorroYA can be marked production-ready only when:

- Lint, typecheck, tests, build, staging checks, production-safe checks, secret scan, and RLS pass.
- Production env values are complete and verified without printing secrets.
- PayPal live is configured and tested.
- Google OAuth production is verified.
- Supabase production security gates are verified.
- Backup and revert evidence exist.
- Production gate emits `PASS_PRODUCTION_READY`.
