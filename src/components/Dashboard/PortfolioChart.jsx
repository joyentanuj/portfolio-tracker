import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/constants';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white font-semibold text-sm">{d.name}</p>
      <p className="text-indigo-400 text-sm">{formatCurrency(d.value)}</p>
      <p className="text-gray-400 text-xs">{d.payload.percent?.toFixed(1)}% of portfolio</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PortfolioChart() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  const chartData = Object.entries(stats.categoryBreakdown)
    .filter(([, s]) => s.totalValue > 0)
    .map(([cat, s]) => ({
      name: CATEGORY_LABELS[cat],
      value: s.totalValue,
      color: CATEGORY_COLORS[cat],
      percent: stats.totalValue > 0 ? (s.totalValue / stats.totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">No assets yet. Add your first asset to see the chart.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:w-72 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 w-full">
        <div className="space-y-2">
          {chartData.map(item => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-gray-300 text-xs font-medium truncate">{item.name}</span>
                  <span className="text-white text-xs font-semibold ml-2">{formatCurrencyCompact(item.value)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${item.percent}%`, background: item.color }}
                  />
                </div>
              </div>
              <span className="text-gray-500 text-xs w-10 text-right">{item.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
