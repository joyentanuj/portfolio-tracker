import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import { calculateVolatilityMetrics } from '../../utils/volatilityCalculations';

function buildSeries(base = 100) {
  return Array.from({ length: 120 }, (_, i) => base * Math.pow(1 + (Math.sin(i / 9) * 0.01) + 0.0008, i));
}

export default function VolatilityIndicator() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  const { metrics, trendData } = useMemo(() => {
    const portfolioSeries = buildSeries(Math.max(1, stats.totalValue));
    const benchmarkSeries = buildSeries(Math.max(1, stats.totalValue * 0.95));
    const m = calculateVolatilityMetrics(portfolioSeries, benchmarkSeries);
    return {
      metrics: m,
      trendData: m.rolling30.map((v, i) => ({ i, value: (v || 0) * 100 })),
    };
  }, [stats.totalValue]);

  const annualPct = metrics.annualVolatility * 100;
  const tone = annualPct > 20 ? 'text-red-600' : annualPct > 10 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40"><p className="text-gray-500">Daily Volatility</p><p className="font-semibold text-gray-900 dark:text-gray-100">{(metrics.dailyVolatility * 100).toFixed(2)}%</p></div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40"><p className="text-gray-500">Annual Volatility</p><p className={`font-semibold ${tone}`}>{annualPct.toFixed(2)}%</p></div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40"><p className="text-gray-500">Beta</p><p className="font-semibold text-gray-900 dark:text-gray-100">{metrics.beta.toFixed(2)}</p></div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40"><p className="text-gray-500">Sharpe Ratio</p><p className="font-semibold text-gray-900 dark:text-gray-100">{metrics.sharpe.toFixed(2)}</p></div>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="i" hide />
            <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
            <Line type="monotone" dataKey="value" stroke="#f97316" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
