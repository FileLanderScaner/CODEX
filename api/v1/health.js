import { json, runEndpoint } from './_utils.js';

export default function handler(req, res) {
  return runEndpoint(req, res, ['GET'], 'health', async (_req, _res, reqId) => {
    json(res, 200, { status: 'ok', service: 'ahorroya-api' }, reqId);
  });
}
