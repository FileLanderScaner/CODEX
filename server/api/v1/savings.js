import { z } from 'zod';
import { json, requireUser, runEndpoint, supabaseRest, validate } from './_utils.js';

const savingSchema = z.object({
  product_name: z.string().min(1),
  search_query: z.string().min(1),
  cheapest_store: z.string().min(1),
  cheapest_price: z.coerce.number().nonnegative(),
  expensive_store: z.string().min(1),
  expensive_price: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('UYU'),
}).refine((body) => body.expensive_price >= body.cheapest_price, {
  message: 'expensive_price must be greater than or equal to cheapest_price',
  path: ['expensive_price'],
});

function monthlyStart(offset = 0) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCMonth(date.getUTCMonth() - offset);
  return date;
}

function summary(rows = []) {
  const total = rows.reduce((sum, row) => sum + Number(row.savings_amount || 0), 0);
  return {
    total: Math.round(total * 100) / 100,
    count: rows.length,
    avg: rows.length ? Math.round((total / rows.length) * 100) / 100 : 0,
  };
}

async function readSavingsRows(userId, from, to = null) {
  const filters = [
    `user_id=eq.${encodeURIComponent(userId)}`,
    `created_at=gte.${encodeURIComponent(from.toISOString())}`,
    'select=savings_amount,created_at',
    'limit=1000',
  ];
  if (to) filters.push(`created_at=lt.${encodeURIComponent(to.toISOString())}`);
  return supabaseRest(`user_savings?${filters.join('&')}`);
}

export default function savings(req, res) {
  return runEndpoint(req, res, ['GET', 'POST'], 'savings', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    if (req.method === 'POST') {
      const body = validate(savingSchema, req.body);
      const rows = await supabaseRest('user_savings', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, ...body }),
      });
      const current = summary(await readSavingsRows(user.id, monthlyStart(0), monthlyStart(-1)));
      return json(res, 201, {
        data: rows?.[0] || null,
        savings_amount: body.expensive_price - body.cheapest_price,
        user_monthly_total: current.total,
        should_show_paywall: current.total > 50,
      }, reqId);
    }

    const thisMonth = summary(await readSavingsRows(user.id, monthlyStart(0), monthlyStart(-1)));
    const lastMonth = summary(await readSavingsRows(user.id, monthlyStart(1), monthlyStart(0)));
    const allTime = summary(await readSavingsRows(user.id, new Date('2020-01-01T00:00:00.000Z')));
    return json(res, 200, {
      this_month: { ...thisMonth, trend: thisMonth.total >= lastMonth.total ? 'up' : 'down' },
      last_month: lastMonth,
      all_time: allTime,
      paywall_trigger_met: thisMonth.total > 50,
      next_milestone: 100,
      milestone_progress: Math.min(100, Math.round((thisMonth.total / 100) * 100)),
    }, reqId);
  });
}
