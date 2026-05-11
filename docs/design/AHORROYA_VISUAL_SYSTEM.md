# AhorroYA Visual System

Date: 2026-05-11

## Status

```text
VISUAL_SYSTEM_UPGRADE=PASS
PRODUCTION_STATUS=NO-GO_PRODUCTION
```

## Design Direction

AhorroYA now uses a more premium consumer-fintech style while keeping the app lightweight and readable:

- Soft money/savings palette with green, blue, white, and warm amber accents.
- Glass-like surfaces for high-priority cards and navigation.
- Controlled glow on primary and Premium CTAs.
- Modern pill badges for trust, savings, and pricing context.
- Mobile-first spacing and larger touch targets.
- Smooth entrance animations for key sections.

## Tokens

Main tokens live in `lib/ui.js`.

| Token group | Purpose |
| --- | --- |
| `ui.colors.background` / `backgroundDeep` | App background and layered depth |
| `ui.colors.surfaceGlass` | Premium glass-like cards/nav |
| `ui.colors.primary` / `primaryInk` / `primarySoft` | Savings and action language |
| `ui.colors.secondary` / `secondarySoft` | Product and store contrast |
| `ui.colors.premiumBg` / `premiumInk` | Premium CTA and paywall surfaces |
| `ui.gradients.app` | Subtle app background |
| `ui.gradients.primary` | Main CTA gradient |
| `ui.gradients.premium` | Premium cards/buttons |
| `ui.gradients.savings` | Savings cards and hero surfaces |

## Component Rules

- Use `GlowButton` for primary CTAs and important share/payment-adjacent actions.
- Use `SurfaceCard` for standard content, now with larger radius and stronger depth.
- Use `GradientBorderCard` for high-value moments only.
- Use `SavingsCard` when the user has seen a concrete price difference.
- Use `PremiumCtaCard` for Premium conversion moments after value is shown.
- Use `TrustBadge` and `PriceComparisonBadge` for compact proof, not long explanatory copy.

## Accessibility And Performance

- No heavy animation or visual libraries were added.
- Animations use built-in React Native `Animated` with native driver.
- CTAs keep minimum touch height of roughly 44-56 px.
- Color is not the only indicator: savings badges include text labels.
- Copy avoids guaranteed-savings claims.
- Gradients are web-enhanced with solid fallbacks for native.

## Libraries

No new libraries were installed.

shadcn/ui, Magic UI, Aceternity, and Motion were not added because this branch is Expo/React Native Web, not a Tailwind/DOM component stack. Adding them would increase bundle and integration risk without clear production value for this cycle.

## Production Safety

This cycle did not touch:

- Production deploys.
- Vercel Production envs.
- PayPal live.
- Supabase production.
- RLS policies.
- AI agent flags.
- Secrets or `.env` files.
