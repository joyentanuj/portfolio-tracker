import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/constants';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">{d.name}</p>
      <p className="text-indigo-600 text-sm">{formatCurrency(d.value)}</p>
      <p className="text-gray-500 dark:text-gray-400 text-xs">{d.payload.allocation?.toFixed(1)}% of portfolio</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const MIN_LABEL_PERCENT_THRESHOLD = 0.03;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < MIN_LABEL_PERCENT_THRESHOLD) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">{`${(percent * 100).toFixed(1)}%`}</text>;
};

export default function PortfolioChart({ selectedCategory, onSelectCategory, allowedCategories }) {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  const chartData = Object.entries(stats.categoryBreakdown)
    .filter(([cat, s]) => s.totalValue > 0 && (!allowedCategories?.length || allowedCategories.includes(cat)))
    .map(([cat, s]) => ({
      category: cat,
      name: CATEGORY_LABELS[cat],
      value: s.totalValue,
      color: CATEGORY_COLORS[cat],
      allocation: stats.totalValue > 0 ? (s.totalValue / stats.totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return <div className="flex flex-col items-center justify-center h-64 text-gray-400"><PieChartIcon className="w-10 h-10 mb-3" /><p className="text-sm">No assets yet. Add your first asset to see the chart.</p></div>;
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
              isAnimationActive
              animationDuration={450}
              onClick={(payload) => onSelectCategory?.(selectedCategory === payload.category ? null : payload.category)}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  fillOpacity={!selectedCategory || selectedCategory === entry.category ? 1 : 0.35}
                  stroke={selectedCategory === entry.category ? '#111827' : 'none'}
                  strokeWidth={selectedCategory === entry.category ? 2 : 0}
                  style={{ transition: 'all 300ms ease', animationDelay: `${idx * 40}ms` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 w-full">
        {selectedCategory && (
          <button onClick={() => onSelectCategory?.(null)} className="mb-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <X className="w-3 h-3" /> Clear filter
          </button>
        )}
        <div className="space-y-2">
          {chartData.map(item => (
            <button
              key={item.name}
              onClick={() => onSelectCategory?.(selectedCategory === item.category ? null : item.category)}
              className={`w-full flex items-center gap-3 text-left p-1 rounded-md transition-all duration-300 ${selectedCategory === item.category ? 'bg-gray-100 dark:bg-gray-700/60' : ''}`}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-gray-700 dark:text-gray-300 text-xs font-medium truncate">{item.name}</span>
                  <span className="text-gray-900 dark:text-gray-100 text-xs font-semibold ml-2">{formatCurrencyCompact(item.value)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${item.allocation}%`, background: item.color }} />
                </div>
              </div>
              <span className="text-gray-400 dark:text-gray-500 text-xs w-10 text-right">{item.allocation.toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
