# AhorroYA Premium Feature Matrix

Date: 2026-05-10

## Status

- Premium billing model: PayPal subscription
- Sandbox: ready
- Live: blocked by missing external live credentials
- Production: `NO-GO_PRODUCTION`

## Feature Matrix

| Feature | Free | Premium | Enforcement Source | Status |
| --- | --- | --- | --- | --- |
| Product search | Limited by product policy | Unlimited | App feature gate | Ready for gating |
| Price comparison | Basic | Full comparison | App feature gate | Ready for gating |
| Savings summary | Basic current session | Historical savings | API + Premium status | Ready for gating |
| Price alerts | Limited | Unlimited | App feature gate | Ready for gating |
| Favorites | Limited | Unlimited | App feature gate | Ready for gating |
| Ads | Eligible | Hidden/reduced | App feature gate | Documented |
| Price history | Limited | Full history | App feature gate | Ready for gating |
| Smart cart optimization | Basic | Advanced optimization | App feature gate | Ready for gating |
| AI savings assistant | Disabled by default | Future gated feature | AI Gateway flags | Blocked until AI gate |

## Premium Entitlement Source

The canonical entitlement source is `/api/v1/billing/me`.

The client must treat a user as premium only when at least one subscription has:

- normalized status `active`; and
- no period end, or a future `current_period_end` / `expires_at` value.

The UI must not trust local demo premium state for real billing. Demo premium is only allowed when PayPal/Supabase configuration is absent.

## Required Feature Flags

| Flag | Production Default | Purpose |
| --- | --- | --- |
| `PAYPAL_ENV` | `sandbox` until live gate passes | Selects sandbox or live PayPal API |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | Required for visible PayPal checkout | Public PayPal client ID |
| `AI_GATEWAY_ENABLED` | `false` | Keeps AI calls disabled |
| `ENABLE_AI_AGENTS` | `false` | Keeps autonomous agents disabled |
| `ENABLE_ADMIN_AI_PANEL` | `false` | Blocks admin AI UI |

## Gating Rules

1. Do not unlock Premium from client-only state after a real PayPal checkout.
2. Do not unlock Premium on `approval_pending`.
3. Unlock Premium only from signed PayPal subscription webhook or trusted server state.
4. Disable Premium on `suspended`, `expired`, or `payment_failed`.
5. For `cancelled`, keep access only if PayPal supplies a future period end.

## Remaining Commercial Work

- Define final public pricing in UYU/USD.
- Decide limits for free search, favorites, and alerts.
- Add revenue dashboard for subscription conversion and churn.
- Add cancellation UX that explains billing source and renewal status.
