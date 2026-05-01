import { normalizeProduct, normalizeStoreKey } from './price-service';

const KNOWN_BRANDS = [
  'conaprole',
  'saman',
  'optimo',
  'canarias',
  'cololo',
  'coca cola',
  'salus',
  'nativa',
  'la abuelita',
  'punta ballena',
];

const UNIT_PATTERNS = [
  { regex: /(\d+(?:[.,]\d+)?)\s*(litros?|lts?|lt|l)\b/i, unit: 'L', factor: 1 },
  { regex: /(\d+(?:[.,]\d+)?)\s*(ml|cc)\b/i, unit: 'L', factor: 0.001 },
  { regex: /(\d+(?:[.,]\d+)?)\s*(kilos?|kgs?|kg)\b/i, unit: 'kg', factor: 1 },
  { regex: /(\d+(?:[.,]\d+)?)\s*(grs?|gramos?|g)\b/i, unit: 'kg', factor: 0.001 },
  { regex: /(\d+(?:[.,]\d+)?)\s*(unidades?|unidad|un|u)\b/i, unit: 'unidad', factor: 1 },
];

const NOISE_WORDS = new Set([
  'supermercado',
  'catalogo',
  'online',
  'oferta',
  'pack',
  'x',
]);

function parseNumber(value) {
  const parsed = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function cleanProductName(value) {
  return normalizeProduct(value)
    .replace(/[^\w\s.,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectUnit(value) {
  const text = cleanProductName(value);
  for (const pattern of UNIT_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      const amount = parseNumber(match[1]);
      if (amount) {
        return {
          raw: match[0],
          amount,
          baseAmount: amount * pattern.factor,
          unit: pattern.unit,
        };
      }
    }
  }
  return { raw: '', amount: null, baseAmount: null, unit: 'unidad' };
}

export function detectBrand(value, explicitBrand = '') {
  const explicit = cleanProductName(explicitBrand);
  if (explicit) return explicit;
  const text = cleanProductName(value);
  return KNOWN_BRANDS.find((brand) => text.includes(brand)) || '';
}

export function comparableKey(value, explicitBrand = '') {
  const text = cleanProductName(value);
  const unit = detectUnit(text);
  const brand = detectBrand(text, explicitBrand);
  const stripped = text
    .replace(unit.raw, ' ')
    .replace(brand, ' ')
    .split(' ')
    .filter((word) => word && !NOISE_WORDS.has(word) && !/^\d+$/.test(word))
    .slice(0, 5)
    .join(' ')
    .trim();

  return [stripped || text, brand, unit.unit, unit.baseAmount ? unit.baseAmount.toFixed(3) : ''].filter(Boolean).join('|');
}

export function pricePerUnit(price, unitInfo) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !unitInfo?.baseAmount) {
    return null;
  }
  return Math.round((numericPrice / unitInfo.baseAmount) * 100) / 100;
}

export function similarityScore(a, b) {
  const left = new Set(cleanProductName(a).split(' ').filter(Boolean));
  const right = new Set(cleanProductName(b).split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;
  return Math.round((overlap / union) * 100);
}

export function normalizeComparableProduct(item = {}, query = '') {
  const label = item.displayName || item.product || item.normalizedProduct || query;
  const cleanedName = cleanProductName(label);
  const unitInfo = detectUnit(`${label} ${item.unit || ''}`);
  const brand = detectBrand(label, item.brand);
  const key = comparableKey(label, brand);

  return {
    ...item,
    product: normalizeProduct(item.product || cleanedName || query),
    normalizedProduct: normalizeProduct(item.normalizedProduct || item.product || cleanedName || query),
    displayName: item.displayName || cleanedName,
    brand,
    unit: item.unit || unitInfo.raw || unitInfo.unit,
    comparableKey: key,
    normalizedName: cleanedName,
    unitInfo,
    pricePerUnit: pricePerUnit(item.price, unitInfo),
    similarity: similarityScore(cleanedName, query || cleanedName),
    storeKey: normalizeStoreKey(item.store),
  };
}
