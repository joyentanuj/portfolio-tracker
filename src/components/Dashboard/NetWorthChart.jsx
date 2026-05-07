import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrencyCompact } from '../../utils/formatters';

const FALLBACK_USD_INR = 85.0;

function buildMonthlyInvestedData(data, prices) {
  const txCategories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];
  const usdInrRate = prices['USDINR=X']?.price || FALLBACK_USD_INR;

  // Build investment events for cumulative invested tracking
  const events = [];
  for (const cat of txCategories) {
    for (const asset of (data[cat] || [])) {
      for (const tx of (asset.transactions || [])) {
        const amount = tx.type === 'buy' ? Number(tx.amount) : -Number(tx.amount);
        events.push({ date: new Date(tx.date), amount });
      }
    }
  }
  events.sort((a, b) => a.date - b.date);

  // Build per-asset holding data for portfolio value calculation
  const assetHoldings = [];
  for (const cat of txCategories) {
    for (const asset of (data[cat] || [])) {
      const priceKey = (cat === 'stocks' || cat === 'usStocks') ? asset.symbol
        : cat === 'mutualFunds' ? asset.schemeCode
        : (asset.type === 'etf' && asset.symbol) ? asset.symbol
        : cat;
      const livePrice = (cat === 'gold' || cat === 'silver') && asset.type !== 'etf'
        ? prices[cat]?.price
        : prices[priceKey]?.price ?? prices[priceKey]?.nav;
      const fxRate = cat === 'usStocks' ? usdInrRate : 1;

      if (!livePrice) continue;

      const txs = (asset.transactions || [])
        .map(tx => ({ date: new Date(tx.date), type: tx.type, quantity: Number(tx.quantity) }))
        .sort((a, b) => a.date - b.date);

      if (txs.length > 0) {
        assetHoldings.push({ txs, livePrice, fxRate });
      }
    }
  }

  const start = new Date('2026-04-01');
  const now = new Date();
  now.setDate(1);

  // Pre-calculate cumulative invested for events before April 2026
  let cumulative = 0;
  let eventIdx = 0;
  while (eventIdx < events.length && events[eventIdx].date < start) {
    cumulative += events[eventIdx].amount;
    eventIdx++;
  }

  const months = [];
  const cursor = new Date(start);

  while (cursor <= now) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);

    // Update cumulative invested
    while (eventIdx < events.length && events[eventIdx].date <= monthEnd) {
      cumulative += events[eventIdx].amount;
      eventIdx++;
    }

    // Calculate portfolio value at this month-end using current prices
    let portfolioValue = 0;
    for (const holding of assetHoldings) {
      let units = 0;
      for (const tx of holding.txs) {
        if (tx.date <= monthEnd) {
          units += tx.type === 'buy' ? tx.quantity : -tx.quantity;
        }
      }
      portfolioValue += Math.max(0, units) * holding.livePrice * holding.fxRate;
    }

    months.push({
      month: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      invested: Math.max(0, Math.round(cumulative)),
      value: Math.round(portfolioValue),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

const VALUE_COLOR = '#10b981';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const portfolioValue = payload[0]?.value;
  const investedValue = payload[0]?.payload?.invested;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-emerald-500 font-semibold">Value: {formatCurrencyCompact(portfolioValue)}</p>
      {investedValue !== undefined && (
        <p className="text-indigo-500 font-medium text-xs mt-0.5">Invested: {formatCurrencyCompact(investedValue)}</p>
      )}
    </div>
  );
};

export default function NetWorthChart() {
  const { data, prices } = usePortfolio();
  const chartData = useMemo(() => buildMonthlyInvestedData(data, prices), [data, prices]);

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
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-700" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tickFormatter={v => formatCurrencyCompact(v)} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill={VALUE_COLOR} radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="value" stroke={VALUE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: VALUE_COLOR }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
