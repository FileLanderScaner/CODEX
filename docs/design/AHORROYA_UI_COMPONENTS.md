# AhorroYA UI Components

Date: 2026-05-11

## New Components

| Component | File | Purpose |
| --- | --- | --- |
| `GlowButton` | `components/ui/GlowButton.js` | Primary, Premium, and secondary CTAs with press feedback and controlled glow |
| `GradientBorderCard` | `components/ui/GradientBorderCard.js` | High-emphasis card shell with gradient border/fallback |
| `AnimatedSection` | `components/ui/AnimatedSection.js` | Lightweight entrance animation for key sections |
| `TrustBadge` | `components/ui/TrustBadge.js` | Compact trust/status badges |
| `PriceComparisonBadge` | `components/ui/PriceComparisonBadge.js` | Savings/best-price labeling that does not rely only on color |
| `SavingsCard` | `components/ui/SavingsCard.js` | Reusable value-moment card showing estimated savings |
| `PremiumCtaCard` | `components/ui/PremiumCtaCard.js` | Premium CTA after the user sees value |

## Updated Components

| Component | Change |
| --- | --- |
| `SurfaceCard` | Larger radius, optional `tone`, softer premium-ready defaults |
| `SearchBar` | Modern glass surface, stronger icon affordance, larger touch target |
| `BottomNav` | Floating glass nav, gradient active state, tap feedback |
| `TopBar` | Better location affordance and elevated QR button |
| `PremiumCard` | Now uses `PremiumCtaCard` |
| `PaywallContextual` | Premium badge, safer card colors, fixed annual plan contrast |

## Updated Screens

| Screen | Change |
| --- | --- |
| Landing | New premium hero, CTA, proof badges, animated sections, savings cards |
| Home | Hero card, modern CTA, proof surface, savings card for deal of day |
| Results | Savings card for value moment, modern WhatsApp CTA, best-price badge |
| Product detail | Gradient header, trust badge, modern alert and WhatsApp actions |

## Usage Examples

```js
<GlowButton onPress={runSearch}>Comparar ahora</GlowButton>
```

```js
<SavingsCard
  title="Encontraste $21 de diferencia"
  subtitle="Mejor precio en Disco. Compara antes de comprar."
  amount="$21"
  meta="estimado"
/>
```

```js
<TrustBadge label="Montevideo beta" tone="safe" />
```

## Design Constraints

- Keep cards clear and not nested.
- Keep text sizes stable; do not scale by viewport width.
- Keep CTAs direct and action-oriented.
- Keep Premium visually attractive but not misleading.
- Keep PayPal live and production claims out of UI until gates pass.
