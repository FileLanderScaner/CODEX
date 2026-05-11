# AhorroYA Real User QA Checklist

Date: 2026-05-11

## Mobile

- App loads under normal mobile network.
- Hero value is understood in under 5 seconds.
- Search input is visible without scrolling too far.
- Suggested products are tappable.
- Results fit narrow screens.
- WhatsApp opens with prefilled text.
- Copy fallback works.

## Desktop

- Landing loads.
- User can open app.
- Search works.
- Product detail opens.
- Premium screen opens.
- No console-visible secret values.

## Search

- Search "yerba".
- Search "leche".
- Search "arroz".
- Search nonexistent product.
- Empty state explains what to try next.
- Loading state does not look broken.

## Sharing

- WhatsApp message includes product, store, savings, and app link.
- Copied message includes the same information.
- Share feedback appears after action.

## Premium

- Premium CTA appears after value moment.
- Benefits are concrete.
- User must sign in before real payment association.
- PayPal sandbox checkout starts.
- PayPal failure shows understandable message.

## Auth/Favorites

- Anonymous user can search.
- Logged-in user can save favorite.
- Favorite state persists or falls back locally.

## Security

- No `.env` or secrets in client bundle output.
- AI agents remain disabled.
- PayPal remains sandbox.
- Production remains `NO-GO_PRODUCTION`.

## Final Build

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run staging:check`
- `npm run production:check`
