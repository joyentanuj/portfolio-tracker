import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrencyCompact } from '../../utils/formatters';

function buildMonthlyInvestedData(data) {
  const categories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];
  const events = [];
  for (const cat of categories) {
    for (const asset of (data[cat] || [])) {
      for (const tx of (asset.transactions || [])) {
        const amount = tx.type === 'buy' ? Number(tx.amount) : -Number(tx.amount);
        events.push({ date: new Date(tx.date), amount });
      }
    }
  }
  if (events.length === 0) return [];

  events.sort((a, b) => a.date - b.date);

  const start = new Date(events[0].date);
  start.setDate(1);
  const now = new Date();
  now.setDate(1);

  const months = [];
  const cursor = new Date(start);
  let cumulative = 0;
  let eventIdx = 0;

  while (cursor <= now) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    while (eventIdx < events.length && events[eventIdx].date <= monthEnd) {
      cumulative += events[eventIdx].amount;
      eventIdx++;
    }
    months.push({
      month: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      invested: Math.max(0, Math.round(cumulative)),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-indigo-600 font-semibold">{formatCurrencyCompact(payload[0].value)}</p>
    </div>
  );
};

export default function NetWorthChart() {
  const { data } = usePortfolio();
  const chartData = useMemo(() => buildMonthlyInvestedData(data), [data]);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        Add transactions to see your investment timeline.
      </div>
    );
  }

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-700" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tickFormatter={v => formatCurrencyCompact(v)} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="invested" stroke="#6366f1" strokeWidth={2} fill="url(#investedGradient)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
