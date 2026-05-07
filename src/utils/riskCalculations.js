const BASE_RISK = {
  stocks: 0.75,
  usStocks: 0.78,
  mutualFunds: 0.55,
  fixedDeposits: 0.15,
  ppf: 0.12,
  epfo: 0.2,
  gold: 0.5,
  silver: 0.65,
  cash: 0.05,
  realEstate: 0.45,
  others: 0.5,
};

export function calculateAssetRisk({ category, weight = 0, pnlPercent = 0, volatility = 0 }) {
  const base = BASE_RISK[category] ?? 0.5;
  const concentrationPenalty = Math.min(0.2, (weight / 100) * 0.4);
  const performanceVolatility = Math.min(0.25, Math.abs(pnlPercent) * 0.25);
  const volPenalty = Math.min(0.2, Math.abs(volatility) * 0.15);
  const score = Math.max(0, Math.min(1, base + concentrationPenalty + performanceVolatility + volPenalty));

  if (score >= 0.67) return { level: 'High', score };
  if (score >= 0.34) return { level: 'Medium', score };
  return { level: 'Low', score };
}

export function calculatePortfolioRisk(risks = []) {
  if (!risks.length) return { level: 'Low', score: 0 };
  const weighted = risks.reduce((sum, r) => sum + (r.score * (r.weight ?? 1)), 0);
  const totalWeight = risks.reduce((sum, r) => sum + (r.weight ?? 1), 0) || 1;
  const score = weighted / totalWeight;
  if (score >= 0.67) return { level: 'High', score };
  if (score >= 0.34) return { level: 'Medium', score };
  return { level: 'Low', score };
}
