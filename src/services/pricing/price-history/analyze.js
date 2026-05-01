export function analyzePriceHistory(rows = []) {
  const sorted = [...rows].sort((a, b) => new Date(a.observed_at || a.created_at) - new Date(b.observed_at || b.created_at));
  if (!sorted.length) {
    return { trend: 'unknown', opportunity: false, change: 0, latest: null };
  }
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2] || latest;
  const change = Math.round((Number(latest.price) - Number(previous.price)) * 100) / 100;
  const min = Math.min(...sorted.map((row) => Number(row.price)).filter(Number.isFinite));
  const opportunity = Number(latest.price) <= min * 1.03;
  return {
    trend: change < 0 ? 'down' : change > 0 ? 'up' : 'flat',
    opportunity,
    change,
    latest,
    min_price: min,
    observations: sorted.length,
  };
}
