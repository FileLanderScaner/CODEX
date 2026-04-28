import { fetchText, parseCsv, sourceResult } from './_shared.js';

const DEFAULT_URL = process.env.ODEPA_FEED_URL || 'https://datos.odepa.gob.cl/';

export const chileOdepaAdapter = {
  code: 'cl_odepa',
  schedule: 'mayorista diario habil; consumidor semanal',
  async ingest(options = {}) {
    const url = options.url || DEFAULT_URL;
    const raw = await fetchText(url);
    const rows = parseCsv(raw);

    return sourceResult(this.code, raw, rows, (row) => ({
      sourceCode: this.code,
      countryCode: 'CL',
      productName: row.producto || row.Producto || row.nombre_producto,
      storeName: row.mercado || row.Mercado || row.establecimiento || 'ODEPA',
      regionName: row.region || row.Region || 'Chile',
      currency: row.moneda || 'CLP',
      price: row.precio || row.Precio || row.valor,
      unit: row.unidad || row.Unidad || 'kg',
      observedAt: row.fecha || row.Fecha || new Date(),
      qualityScore: 92,
    }));
  },
};
