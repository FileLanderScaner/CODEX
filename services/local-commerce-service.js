import { resolveSearchIntent } from './search-intent-service.js';

const LOCAL_COMMERCE_DIRECTORY = [
  {
    id: 'farmashop',
    name: 'Farmashop',
    categories: ['bebes', 'farmacia', 'cuidado personal'],
    hoursLabel: 'Varias sucursales con horario extendido',
    deliveryLabel: 'Delivery y retiro segun zona',
    contactLabel: 'Contacto en web oficial',
    officialUrl: 'https://www.farmashop.com.uy/',
    searchUrl: (query) => `https://www.farmashop.com.uy/search?text=${encodeURIComponent(query)}`,
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Farmashop%20Montevideo',
    trust: 'oficial',
  },
  {
    id: 'san-roque',
    name: 'San Roque',
    categories: ['bebes', 'farmacia', 'cuidado personal'],
    hoursLabel: 'Sucursales y horarios en web oficial',
    deliveryLabel: 'Entrega segun zona',
    contactLabel: 'Contacto en web oficial',
    officialUrl: 'https://www.sanroque.com.uy/',
    searchUrl: (query) => `https://www.sanroque.com.uy/search?text=${encodeURIComponent(query)}`,
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=San%20Roque%20Montevideo',
    trust: 'oficial',
  },
  {
    id: 'pedidosya-market',
    name: 'PedidosYa Market',
    categories: ['bebes', 'bebidas', 'supermercado', 'mascotas'],
    hoursLabel: 'Disponibilidad depende de zona y hora',
    deliveryLabel: 'Envio inmediato si esta disponible',
    contactLabel: 'Gestion desde app oficial',
    officialUrl: 'https://www.pedidosya.com.uy/',
    searchUrl: (query) => `https://www.pedidosya.com.uy/search/${encodeURIComponent(query)}`,
    mapUrl: 'https://www.pedidosya.com.uy/',
    trust: 'oficial',
  },
  {
    id: 'mercado-libre',
    name: 'Mercado Libre',
    categories: ['bebes', 'mascotas', 'cuidado personal', 'supermercado'],
    hoursLabel: 'Marketplace online',
    deliveryLabel: 'Envio segun vendedor',
    contactLabel: 'Mensajeria dentro de la plataforma',
    officialUrl: 'https://www.mercadolibre.com.uy/',
    searchUrl: (query) => `https://listado.mercadolibre.com.uy/${encodeURIComponent(query)}`,
    mapUrl: 'https://www.mercadolibre.com.uy/',
    trust: 'marketplace',
  },
  {
    id: 'disco',
    name: 'Disco',
    categories: ['supermercado', 'bebidas', 'bebes', 'mascotas'],
    hoursLabel: 'Horarios por sucursal',
    deliveryLabel: 'Envio segun zona',
    contactLabel: 'Contacto en web oficial',
    officialUrl: 'https://www.disco.com.uy/',
    searchUrl: (query) => `https://www.disco.com.uy/${encodeURIComponent(query)}`,
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Disco%20Montevideo',
    trust: 'oficial',
  },
  {
    id: 'tata',
    name: 'Ta-Ta',
    categories: ['supermercado', 'bebidas', 'bebes', 'mascotas'],
    hoursLabel: 'Horarios por sucursal',
    deliveryLabel: 'Envio segun zona',
    contactLabel: 'Contacto en web oficial',
    officialUrl: 'https://www.tata.com.uy/',
    searchUrl: (query) => `https://www.tata.com.uy/${encodeURIComponent(query)}`,
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ta-Ta%20Montevideo',
    trust: 'oficial',
  },
];

function currentHour(date = new Date()) {
  return date.getHours();
}

export function getPremiumLocalSuggestions(query, options = {}) {
  const intent = resolveSearchIntent(query);
  const hour = Number.isFinite(Number(options.hour)) ? Number(options.hour) : currentHour();
  const lateNight = hour < 7 || hour >= 22;
  const matches = LOCAL_COMMERCE_DIRECTORY
    .filter((commerce) => commerce.categories.includes(intent.category) || commerce.categories.includes('supermercado'))
    .map((commerce) => ({
      ...commerce,
      query: intent.query,
      openSignal: lateNight ? 'Confirmar abierto ahora' : 'Ver horarios',
      priority: (lateNight && ['farmashop', 'pedidosya-market'].includes(commerce.id)) ? 0 : commerce.categories.includes(intent.category) ? 1 : 2,
      url: commerce.searchUrl(intent.query),
    }))
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    query: intent.query,
    originalQuery: intent.originalQuery,
    category: intent.category,
    corrected: intent.corrected,
    restricted: intent.restricted,
    lateNight,
    generatedAt: new Date().toISOString(),
    suggestions: matches,
  };
}
