import { normalizeComparableProduct, similarityScore } from '../../../../services/product-normalizer.js';

export function fuzzyMatchProducts(query, offers = [], options = {}) {
  const minScore = Number(options.minScore ?? 38);
  return offers
    .map((offer) => {
      const normalized = normalizeComparableProduct(offer, query);
      const score = Math.max(normalized.similarity || 0, similarityScore(query, `${normalized.displayName} ${normalized.brand}`));
      return { ...normalized, confidence_score: score };
    })
    .filter((offer) => offer.confidence_score >= minScore)
    .sort((a, b) => b.confidence_score - a.confidence_score);
}
