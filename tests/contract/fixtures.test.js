import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../src/services/pricing/adapters/_shared.js';

describe('official source fixtures', () => {
  it('parses ODEPA-style CSV fixture', () => {
    const rows = parseCsv('Producto,Mercado,Region,Precio,Fecha\nPapa,Lo Valledor,RM,1000,2026-04-27\n');
    expect(rows[0].Producto).toBe('Papa');
  });

  it('parses PROFECO-style CSV fixture', () => {
    const rows = parseCsv('PRODUCTO,CADENA_COMERCIAL,ESTADO,PRECIO,FECHA_REGISTRO\nTortilla,Tienda,CDMX,20.50,2026-04-27\n');
    expect(rows[0].PRECIO).toBe('20.50');
  });
});
