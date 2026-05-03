import alerts from '../server/api/v1/alerts.js';
import aiAssistant from '../server/api/v1/ai-assistant.js';
import aiAgents from '../server/api/v1/ai-agents.js';
import adminApprovePrice from '../server/api/v1/admin/approve-price.js';
import adminJobs from '../server/api/v1/admin/jobs.js';
import adminReports from '../server/api/v1/admin/reports.js';
import adminRetryJob from '../server/api/v1/admin/retry-job/[id].js';
import cartOptimize from '../server/api/v1/cart-optimize.js';
import billingCreate from '../server/api/v1/billing/subscriptions/create.js';
import billingMe from '../server/api/v1/billing/me.js';
import billingPaypalWebhook from '../server/api/v1/billing/webhooks/paypal.js';
import categories from '../server/api/v1/categories.js';
import catalogSearch from '../server/api/v1/catalog-search.js';
import events from '../server/api/v1/events.js';
import favorites from '../server/api/v1/favorites.js';
import growthContent from '../server/api/v1/growth-content.js';
import growthMetrics from '../server/api/v1/growth-metrics.js';
import health from '../server/api/v1/health.js';
import internalImport from '../server/api/v1/internal/import/[source].js';
import { adEvent, affiliateRedirect, b2bDashboard, b2bExportCsv, commercialLead } from '../server/api/v1/monetization.js';
import legacyMe from '../server/api/me.js';
import legacyMonetizationEvent from '../server/api/monetization-event.js';
import legacyPaypalCaptureOrder from '../server/api/paypal/capture-order.js';
import legacyPaypalCreateOrder from '../server/api/paypal/create-order.js';
import legacyPaypalWebhook from '../server/api/paypal/webhook.js';
import legacyPremiumStatus from '../server/api/premium-status.js';
import legacyPrices from '../server/api/prices.js';
import legacyProductClick from '../server/api/product-click.js';
import legacyReports from '../server/api/reports.js';
import legacyShares from '../server/api/shares.js';
import priceHistory from '../server/api/v1/prices/history/[productId].js';
import prices from '../server/api/v1/prices/index.js';
import pricesCommunity from '../server/api/v1/prices/community.js';
import pricesLatest from '../server/api/v1/prices/latest.js';
import productById from '../server/api/v1/products/[id].js';
import products from '../server/api/v1/products/index.js';
import readiness from '../server/api/v1/readiness.js';
import reports from '../server/api/v1/reports.js';
import savings from '../server/api/v1/savings.js';
import smartSearch from '../server/api/v1/smart-search.js';
import stores from '../server/api/v1/stores.js';

const exactRoutes = new Map([
  ['v1/alerts', alerts],
  ['v1/ai/assistant', aiAssistant],
  ['v1/ai/agents', aiAgents],
  ['v1/admin/approve-price', adminApprovePrice],
  ['v1/admin/jobs', adminJobs],
  ['v1/admin/reports', adminReports],
  ['v1/ads/events', adEvent],
  ['v1/affiliates/redirect', affiliateRedirect],
  ['v1/b2b/dashboard', b2bDashboard],
  ['v1/b2b/export.csv', b2bExportCsv],
  ['v1/billing/me', billingMe],
  ['v1/billing/subscriptions/create', billingCreate],
  ['v1/billing/webhooks/paypal', billingPaypalWebhook],
  ['v1/cart/optimize', cartOptimize],
  ['v1/categories', categories],
  ['v1/catalog/search', catalogSearch],
  ['v1/commercial/leads', commercialLead],
  ['v1/favorites', favorites],
  ['v1/growth/content', growthContent],
  ['v1/growth/metrics', growthMetrics],
  ['v1/health', health],
  ['v1/prices', prices],
  ['v1/prices/community', pricesCommunity],
  ['v1/prices/latest', pricesLatest],
  ['v1/products', products],
  ['v1/readiness', readiness],
  ['v1/reports', reports],
  ['v1/savings', savings],
  ['v1/savings/summary', savings],
  ['v1/search/smart', smartSearch],
  ['v1/stores', stores],
  ['me', legacyMe],
  ['monetization-event', legacyMonetizationEvent],
  ['paypal/capture-order', legacyPaypalCaptureOrder],
  ['paypal/create-order', legacyPaypalCreateOrder],
  ['paypal/webhook', legacyPaypalWebhook],
  ['premium-status', legacyPremiumStatus],
  ['prices', legacyPrices],
  ['product-click', legacyProductClick],
  ['reports', legacyReports],
  ['shares', legacyShares],
]);

function routePath(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  return url.pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '');
}

function mergeQuery(req, values) {
  req.query = { ...(req.query || {}), ...values };
}

export default function handler(req, res) {
  const path = routePath(req);
  const exact = exactRoutes.get(path);
  if (exact) return exact(req, res);

  let match = /^v1\/products\/([^/]+)$/.exec(path);
  if (match) {
    mergeQuery(req, { id: decodeURIComponent(match[1]) });
    return productById(req, res);
  }

  match = /^v1\/prices\/history\/([^/]+)$/.exec(path);
  if (match) {
    mergeQuery(req, { productId: decodeURIComponent(match[1]) });
    return priceHistory(req, res);
  }

  match = /^v1\/admin\/retry-job\/([^/]+)$/.exec(path);
  if (match) {
    mergeQuery(req, { id: decodeURIComponent(match[1]) });
    return adminRetryJob(req, res);
  }

  match = /^v1\/internal\/import\/([^/]+)$/.exec(path);
  if (match) {
    mergeQuery(req, { source: decodeURIComponent(match[1]) });
    return internalImport(req, res);
  }

  res.status(404).json({ error: 'not_found', path });
}
