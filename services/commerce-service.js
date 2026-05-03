import { supabase } from '../lib/supabase.js';
import { getApiUrl } from '../lib/config.js';
import { normalizeProduct } from './price-service.js';
import { getAuthHeaders } from './account-service.js';
import { buildCatalogLinks } from './catalog-service.js';
import { trackEvent } from './tracking-service.js';

export async function loadProductLinks(product) {
  const catalogLinks = buildCatalogLinks(product);
  if (!supabase || !product) {
    return catalogLinks;
  }

  const { data, error } = await supabase
    .from('product_links')
    .select('*')
    .eq('product', normalizeProduct(product))
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    return catalogLinks;
  }

  return [...(data ?? []), ...catalogLinks];
}

export async function trackProductClick(link, source = 'result') {
  if (!link) {
    return;
  }

  await trackEvent('commerce_clicked', {
    product: link.product || null,
    store: link.store || null,
    url: link.url || null,
    source,
  }).catch(() => null);

  const authHeaders = await getAuthHeaders();
  await fetch(getApiUrl('/api/product-click'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      productLinkId: link.id,
      product: link.product,
      source,
    }),
  }).catch(() => null);
}
