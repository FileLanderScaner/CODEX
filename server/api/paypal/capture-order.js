import { enforceOrigin, handleOptions, paypalFetch, recordPremiumOrder, setCors, updatePremiumProfile } from './_utils.js';
import { getBearerToken } from '../_security.js';
import { getUserFromAccessToken } from '../supabase/_auth.js';
import { z } from 'zod';

const captureOrderSchema = z.object({
  orderId: z.string().min(6).max(128),
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
      res.status(401).json({ error: 'Login required to capture Premium' });
      return;
    }

    const { orderId } = captureOrderSchema.parse(req.body || {});

    const capture = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (capture.status !== 'COMPLETED') {
      res.status(402).json({ error: `Payment status is ${capture.status}` });
      return;
    }

    const captureUnit = capture.purchase_units?.[0];
    const capturedCustomId = captureUnit?.custom_id;
    if (capturedCustomId && capturedCustomId !== user.id) {
      res.status(403).json({ error: 'Order does not belong to the current user' });
      return;
    }

    const payment = captureUnit?.payments?.captures?.[0];
    await recordPremiumOrder({
      orderId,
      userId: user.id,
      email: user.email,
      amount: payment?.amount?.value,
      currency: payment?.amount?.currency_code,
      status: capture.status,
    });

    await updatePremiumProfile(user.id, orderId);

    res.status(200).json({
      status: capture.status,
      orderId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not capture PayPal order' });
  }
}
