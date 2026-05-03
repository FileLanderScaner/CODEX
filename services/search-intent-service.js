import { normalizeProduct } from './price-service.js';

const QUERY_ALIASES = [
  {
    canonical: 'panales',
    terms: ['panal', 'panales', 'pañal', 'pañales', 'pananels', 'pañanels', 'diaper', 'diapers', 'huggies', 'pampers'],
    category: 'bebes',
  },
  {
    canonical: 'vino',
    terms: ['vino', 'vinos', 'tinto', 'blanco', 'espumante', 'cerveza', 'whisky', 'bebidas alcoholicas'],
    category: 'bebidas',
    restricted: 'alcohol',
  },
  {
    canonical: 'medicamentos',
    terms: ['medicamento', 'medicamentos', 'farmacia', 'remedio', 'ibuprofeno', 'paracetamol', 'pañales adulto'],
    category: 'farmacia',
  },
  {
    canonical: 'perfumeria',
    terms: ['shampoo', 'acondicionador', 'desodorante', 'jabon', 'pasta dental', 'cepillo dental'],
    category: 'cuidado personal',
  },
  {
    canonical: 'mascotas',
    terms: ['perro', 'gato', 'alimento perro', 'alimento gato', 'comida perro', 'comida gato', 'mascota'],
    category: 'mascotas',
  },
];

function containsTerm(query, term) {
  return query === term || query.includes(term) || term.includes(query);
}

export function resolveSearchIntent(value) {
  const normalized = normalizeProduct(value);
  const match = QUERY_ALIASES.find((entry) => entry.terms.some((term) => containsTerm(normalized, normalizeProduct(term))));
  if (!match) {
    return {
      originalQuery: normalized,
      query: normalized,
      category: 'supermercado',
      restricted: null,
      corrected: false,
    };
  }

  return {
    originalQuery: normalized,
    query: match.canonical,
    category: match.category,
    restricted: match.restricted || null,
    corrected: normalized !== match.canonical,
  };
}

export function canonicalizeProductQuery(value) {
  return resolveSearchIntent(value).query;
}

export function getIntentLabel(intent) {
  if (!intent?.corrected) return '';
  return `Interpretamos "${intent.originalQuery}" como "${intent.query}".`;
}
