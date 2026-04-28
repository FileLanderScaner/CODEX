import { fetchBuffer, fetchText, parseCsv, parsePdf, sourceResult } from './_shared.js';

const DEFAULT_URL = process.env.UAM_FEED_URL || 'https://www.uam.com.uy/';

export const uruguayUamAdapter = {
  code: 'uy_uam_mgap',
  schedule: 'lunes y jueves despues de publicacion',
  async ingest(options = {}) {
    const url = options.url || DEFAULT_URL;
    const kind = options.kind || (url.endsWith('.csv') ? 'csv' : url.endsWith('.pdf') ? 'pdf' : 'html');
    let raw;
    let rows;

    if (kind === 'csv') {
      raw = await fetchText(url);
      rows = parseCsv(raw);
    } else if (kind === 'pdf') {
      const buffer = await fetchBuffer(url);
      raw = await parsePdf(buffer);
      rows = raw.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const parts = line.split(/\s{2,}/);
        return { producto: parts[0], precio: parts.at(-1), unidad: 'kg' };
      });
    } else {
      raw = await fetchText(url);
      rows = [...raw.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis)].map((match) => {
        const cells = [...match[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gis)].map((cell) => cell[1].replace(/<[^>]+>/g, '').trim());
        return { producto: cells[0], precio: cells.find((cell) => /\d/.test(cell)), unidad: cells[2] || 'kg' };
      }).filter((row) => row.producto && row.precio);
    }

    return sourceResult(this.code, raw, rows, (row) => ({
      sourceCode: this.code,
      countryCode: 'UY',
      productName: row.producto || row.product || row.Producto,
      storeName: row.mercado || 'UAM/MGAP',
      regionName: row.region || 'Montevideo',
      currency: 'UYU',
      price: parseFloat(String(row.precio || row.price || row.Precio).replace(',', '.')),
      unit: row.unidad || row.unit || 'kg',
      observedAt: row.fecha || new Date(),
      qualityScore: 88,
    }));
  },
};
