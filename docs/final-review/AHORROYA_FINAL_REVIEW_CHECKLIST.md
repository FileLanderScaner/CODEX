# AhorroYA Final Human Review Checklist

## Staging Review

- [ ] Confirm branch: `codex/preprod-hardening-auth-paypal`.
- [ ] Confirm latest reviewed commit: `b7cd4c965ffc91736357aa0620157908fae0995b` or newer final-review commit.
- [ ] Confirm `STAGING_STATUS=READY_FOR_FIRST_100_USERS`.
- [ ] Confirm Vercel Preview/staging is protected.
- [ ] Confirm public protected access returns expected 401 when protection is active.
- [ ] Confirm staging demo does not use production credentials.

## Product Review

- [ ] User understands the value proposition in less than 5 seconds.
- [ ] User can search for a product.
- [ ] User can compare prices.
- [ ] User sees estimated savings.
- [ ] User can open product detail.
- [ ] User can share savings through WhatsApp or copy fallback.
- [ ] User sees Premium CTA without blocking the core value.
- [ ] Empty, loading, and error states are understandable.
- [ ] Mobile layout is usable.

## Payments Review

- [ ] PayPal remains sandbox.
- [ ] Sandbox webhook documentation exists.
- [ ] Live PayPal credentials are not in the repository.
- [ ] Live PayPal is not advertised as active.
- [ ] Premium benefits are clear and do not overclaim live billing readiness.

## Auth And Security Review

- [ ] Supabase RLS is PASS.
- [ ] Session Pooler RLS validation is PASS.
- [ ] Normal users are blocked where expected.
- [ ] Admin/internal_job paths are allowed only where expected.
- [ ] AI Gateway remains disabled.
- [ ] AI agents remain disabled.
- [ ] No secrets are committed.
- [ ] `.env`, `.env.local`, and `.env.rls` are not staged or committed.

## Production Blocker Review

- [ ] Supabase Auth leaked password protection evidence exists.
- [ ] Production SQL backup evidence exists.
- [ ] Production revert/restore evidence exists.
- [ ] Vercel Production envs are verified securely.
- [ ] PayPal live credentials and webhook are verified.
- [ ] Google OAuth production client and redirect URIs are verified.
- [ ] Production release window and owners are defined.
- [ ] Written production approval exists after every blocker is READY.

## Final Review Decision

- [ ] Approve controlled first-100-user staging review.
- [ ] Reject controlled first-100-user staging review and list fixes.
- [ ] Keep production `NO-GO_PRODUCTION`.
- [ ] Re-run release gate only after external blockers are complete.
