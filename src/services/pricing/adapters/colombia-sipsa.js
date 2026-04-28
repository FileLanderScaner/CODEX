import { soapCall, sourceResult } from './_shared.js';

const DEFAULT_WSDL = process.env.SIPSA_WSDL_URL || 'http://appweb.dane.gov.co/sipsaWS/SrvSipsaUpraBeanService?wsdl';

export const colombiaSipsaAdapter = {
  code: 'co_sipsa',
  schedule: 'diario/semanal con ventana posterior a las 14:00 local',
  async ingest(options = {}) {
    const method = options.method || process.env.SIPSA_SOAP_METHOD || 'consultarPrecios';
    const args = options.args || {};
    const result = await soapCall(options.wsdlUrl || DEFAULT_WSDL, method, args);
    const rawRows = result?.return || result?.precios || result?.items || [];
    const rows = Array.isArray(rawRows) ? rawRows : [rawRows];

    return sourceResult(this.code, result, rows, (row) => ({
      sourceCode: this.code,
      countryCode: 'CO',
      productName: row.producto || row.nombreProducto || row.articulo,
      storeName: row.mercado || row.ciudad || 'SIPSA DANE',
      regionName: row.departamento || row.region || 'Colombia',
      currency: 'COP',
      price: row.precio || row.valor,
      unit: row.unidad || 'kg',
      observedAt: row.fecha || new Date(),
      qualityScore: 93,
    }));
  },
};
