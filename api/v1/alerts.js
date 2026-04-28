import { userCollection } from './_handlers.js';
export default userCollection('price_alerts', (body) => ({ product: body.product, target_price: body.targetPrice, currency: body.currency }));
