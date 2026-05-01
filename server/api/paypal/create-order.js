import { enforceOrigin, handleOptions, paypalFetch, setCors } from './_utils.js';
import { getBearerToken } from '../_security.js';
import { getUserFromAccessToken } from '../supabase/_auth.js';
import { z } from 'zod';

const createOrderSchema = z.object({
  amount: z.coerce.number().positive().max(100).default(4.99),
  currency: z.string().length(3).default('USD'),
  plan: z.enum(['premium_monthly', 'premium_yearly']).default('premium_monthly'),
});

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  setCors(res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const originCheck = enforceOrigin(req);
    if (!originCheck.ok) {
      res.status(403).json({ error: originCheck.error });
      return;
    }

    const accessToken = getBearerToken(req);
    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id || !user?.email) {
      res.status(401).json({ error: 'Login required to purchase Premium' });
      return;
    }

    const { amount, currency, plan } = createOrderSchema.parse(req.body || {});

    const order = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: user.id,
            description: `AhorroYA ${plan}`,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'AhorroYA',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    res.status(200).json({ id: order.id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not create PayPal order' });
  }
}
