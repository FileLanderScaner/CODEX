import { fetchText, parseCsv, sourceResult } from './_shared.js';

const DEFAULT_URL = process.env.PROFECO_QQP_FEED_URL || 'https://datos.profeco.gob.mx/datos_abiertos/qqp.php';

export const mexicoProfecoAdapter = {
  code: 'mx_profeco_qqp',
  schedule: 'mensual o al detectar nuevo recurso',
  async ingest(options = {}) {
    const url = options.url || DEFAULT_URL;
    const raw = await fetchText(url);
    const rows = parseCsv(raw);

    return sourceResult(this.code, raw, rows, (row) => ({
      sourceCode: this.code,
      countryCode: 'MX',
      productName: row.PRODUCTO || row.producto || row.Producto,
      storeName: row.CADENA_COMERCIAL || row.establecimiento || row.tienda || 'PROFECO QQP',
      regionName: row.ESTADO || row.CIUDAD || row.region || 'Mexico',
      currency: 'MXN',
      price: row.PRECIO || row.precio,
      unit: row.PRESENTACION || row.unidad || 'unidad',
      observedAt: row.FECHA_REGISTRO || row.fecha || new Date(),
      qualityScore: 90,
    }));
  },
};
