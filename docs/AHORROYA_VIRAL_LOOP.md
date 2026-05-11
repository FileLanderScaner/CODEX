# AhorroYA Viral Loop

Date: 2026-05-11

## Objective

Every useful search should let one user bring another user through WhatsApp or copied savings text.

## Loop

1. User searches a product.
2. User sees cheapest price and estimated savings.
3. User taps WhatsApp or copies the savings text.
4. Recipient opens link with attribution.
5. Recipient searches the same product or another popular product.
6. App records share click/search completion.

## Share Copy

Template:

```text
Encontre [producto] mas barato en [tienda] con AhorroYA. Ahorro estimado: $[ahorro]. Probalo y compara antes de comprar: [link]
```

Safety:

- Use "ahorro estimado".
- Do not promise guaranteed savings.
- Include link attribution.
- Keep the message short enough for WhatsApp preview.

## Required Tracking

- `whatsapp_share_clicked`
- `savings_copied`
- `share_click`
- `search_completed`
- `savings_calculated`

## Fallbacks

If WhatsApp cannot open:

- Let user copy the message.
- Track `savings_copied`.
- Show feedback that text is ready to paste.

## First Experiment

Run for 7 days:

- Product examples: yerba, leche, arroz, higiene, panales.
- Audience: Montevideo WhatsApp groups and family/friends.
- Goal: 10 shares from first 100 users.
