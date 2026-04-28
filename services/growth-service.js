import { getApiUrl } from '../lib/config';

export async function loadGrowthMetrics() {
  const response = await fetch(getApiUrl('/api/v1/growth/metrics'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'No pudimos cargar metricas de crecimiento.');
  }
  return payload;
}
