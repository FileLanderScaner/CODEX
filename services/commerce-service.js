import { supabase } from '../lib/supabase';
import { normalizeProduct } from './price-service';
import { getAuthHeaders } from './account-service';

export async function loadProductLinks(product) {
  if (!supabase || !product) {
    return [];
  }

  const { data, error } = await supabase
    .from('product_links')
    .select('*')
    .eq('normalized_product', normalizeProduct(product))
    .eq('active', true)
    .order('kind', { ascending: false })
    .limit(4);

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function trackProductClick(link, source = 'result') {
  if (!link) {
    return;
  }

  const authHeaders = await getAuthHeaders();
  await fetch('/api/product-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      productLinkId: link.id,
      product: link.normalized_product,
      source,
    }),
  }).catch(() => null);
}
