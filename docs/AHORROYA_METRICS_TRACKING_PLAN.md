# AhorroYA Metrics Tracking Plan

Date: 2026-05-11

## Status

- `TRACKING_STATUS=READY`
- Provider: internal API with local fallback.
- Failure policy: tracking must never block the app.

## Event Matrix

| Event | When it fires | Core properties | Business goal | Priority |
| --- | --- | --- | --- | --- |
| `app_opened` | App root loads | `platform`, `surface` | Activation baseline | P0 |
| `landing_viewed` | Landing screen is viewed or prices load | `city`, `source`, `prices`, `load_ms` | Landing conversion | P0 |
| `search_started` | User submits a search | `product`, `neighborhood`, `city`, `attribution` | Time-to-value | P0 |
| `search_completed` | Results are available | `product`, `results`, `time_to_first_result_ms` | Activation quality | P0 |
| `product_viewed` | User opens product detail | `product`, `store`, `price` | Intent depth | P1 |
| `cheapest_price_seen` | Cheapest offer is shown | `product`, `price`, `store`, `compared_commerces` | Core value proof | P0 |
| `savings_calculated` | App computes price spread | `product`, `savings`, `cheapest_store` | Savings proof | P0 |
| `whatsapp_share_clicked` | User taps WhatsApp share | `product`, `store`, `url`, `channel` | Viral loop | P0 |
| `savings_copied` | User copies share text | `product`, `store`, `url`, `channel` | Share fallback | P0 |
| `favorite_added` | User saves a product | `product`, `authenticated` | Retention | P1 |
| `premium_cta_seen` | Contextual Premium card appears | `source`, `value_searches`, `favorites`, `alerts` | Monetization funnel | P0 |
| `premium_cta_clicked` | User opens Premium | `source` | Monetization intent | P0 |
| `checkout_started` | PayPal subscription checkout starts | `provider`, `checkout_type`, `plan` | Revenue funnel | P0 |
| `subscription_completed` | Trusted subscription state confirms paid access | `provider`, `plan`, `status` | Revenue conversion | P0 |
| `subscription_failed` | Checkout fails before approval | `provider`, `plan`, `error` | Payment reliability | P0 |

## Compatibility Events

Legacy events remain accepted for existing dashboards:

- `search_submitted`
- `search_product`
- `cheapest_price_shown`
- `view_best_price`
- `click_whatsapp`
- `add_favorite`
- `premium_click`
- `landing_view`
- `open_app`

## Dashboard Questions

Track these daily for the first 100 users:

1. How many users opened the app?
2. What percent searched within 30 seconds?
3. What percent saw a cheapest price?
4. What median savings was calculated?
5. What percent shared by WhatsApp or copied text?
6. What percent saved a favorite or created an alert?
7. What percent saw/clicked Premium?
8. Where did PayPal checkout fail?

## Privacy And Security

- Do not send passwords, tokens, service role keys, PayPal secrets, OAuth secrets, or Vercel bypass tokens.
- Metadata should contain product/store/search context only.
- Errors are truncated before tracking.
- If API tracking fails, local fallback stores a bounded recent event list.
