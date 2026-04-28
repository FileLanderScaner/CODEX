import { normalizeText } from './normalize.js';

export function scoreProductMatch(candidate, product) {
  const left = normalizeText(candidate);
  const right = normalizeText(product);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.82;
  const leftTokens = new Set(left.split(' '));
  const rightTokens = right.split(' ');
  const overlap = rightTokens.filter((token) => leftTokens.has(token)).length;
  return overlap / Math.max(leftTokens.size, rightTokens.length);
}

export function findBestProductMatch(productName, products = []) {
  return products
    .map((product) => ({ product, score: scoreProductMatch(product.name || product.product_name, productName) }))
    .sort((a, b) => b.score - a.score)[0] || null;
}
