import { parse } from 'csv-parse/sync';
import { XMLParser } from 'fast-xml-parser';
import pdf from 'pdf-parse';
import soap from 'soap';
import { canonicalPrice, checksum } from '../normalize.js';

export async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status} for ${url}`);
  }
  return response.text();
}

export async function fetchBuffer(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status} for ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export function parseCsv(text, options = {}) {
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    relax_column_count: true,
    ...options,
  });
}

export function parseXml(text) {
  return new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(text);
}

export async function parsePdf(buffer) {
  const result = await pdf(buffer);
  return result.text;
}

export async function soapCall(wsdlUrl, method, args) {
  const client = await soap.createClientAsync(wsdlUrl);
  const fn = client[`${method}Async`];
  if (!fn) {
    throw new Error(`SOAP method not found: ${method}`);
  }
  const [result] = await fn.call(client, args);
  return result;
}

export function sourceResult(sourceCode, rawPayload, rows, mapper) {
  const payloadChecksum = checksum(rawPayload);
  const prices = rows.map((row) => canonicalPrice({ ...mapper(row), payload: row, externalId: row.externalId || `${sourceCode}:${payloadChecksum}:${rows.indexOf(row)}` }));
  return {
    sourceCode,
    rawCount: rows.length,
    payloadChecksum,
    prices,
    metrics: {
      normalized_rows: prices.length,
      payload_checksum: payloadChecksum,
    },
  };
}
