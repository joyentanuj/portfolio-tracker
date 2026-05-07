import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';

const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 730 },
];

function buildSeries(totalValue, days) {
  const start = Math.max(1, totalValue * 0.82);
  const out = [];
  for (let i = 0; i < days; i++) {
    const drift = 1 + (Math.sin(i / 14) * 0.004) + (i / (days * 450));
    const benchmarkDrift = 1 + (Math.cos(i / 16) * 0.003) + (i / (days * 500));
    const portfolio = start * Math.pow(drift, i);
    const nifty = start * 0.98 * Math.pow(benchmarkDrift, i);
    if (i % 5 === 0 || i === days - 1) {
      out.push({
        day: i,
        date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        portfolioNorm: (portfolio / start) * 100,
        niftyNorm: (nifty / (start * 0.98)) * 100,
      });
    }
  }
  return out;
}

export default function PerformanceComparison() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();
  const [range, setRange] = useState(90);

  const data = useMemo(() => buildSeries(stats.totalValue || 1, range), [stats.totalValue, range]);
  const last = data[data.length - 1] || { portfolioNorm: 100, niftyNorm: 100 };
  const outperformance = last.portfolioNorm - last.niftyNorm;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
          {RANGES.map(r => (
            <button key={r.label} onClick={() => setRange(r.days)} className={`px-2 py-1 rounded-md text-[10px] font-semibold ${range === r.days ? 'bg-white dark:bg-gray-800 text-indigo-600' : 'text-gray-500 dark:text-gray-400'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <p className={`text-xs font-semibold ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(2)}% vs Nifty 50
        </p>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-700" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} hide />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="portfolioNorm" name="Portfolio" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="niftyNorm" name="Nifty 50" stroke="#0ea5e9" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
