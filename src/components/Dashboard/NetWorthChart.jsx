import React, { useMemo, useState } from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrencyCompact } from '../../utils/formatters';

const DATE_RANGES = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: 'All', months: null },
];

const FALLBACK_USD_INR = 85.0;

function buildMonthlyInvestedData(data, prices) {
  const txCategories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];
  const usdInrRate = prices['USDINR=X']?.price || FALLBACK_USD_INR;

  // Build investment events for cumulative invested tracking
  const events = [];
  for (const cat of txCategories) {
    for (const asset of (data[cat] || [])) {
      for (const tx of (asset.transactions || [])) {
        let amount = 0;
        if (tx.type === 'buy') amount = Number(tx.amount);
        else if (tx.type === 'sell') amount = -Number(tx.amount);
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

    const txCount = events.filter((event) => event.date >= cursor && event.date <= monthEnd && event.amount !== 0).length;
    const gain = Math.round(portfolioValue - Math.max(0, cumulative));
    months.push({
      month: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      invested: Math.max(0, Math.round(cumulative)),
      value: Math.round(portfolioValue),
      gain,
      txCount,
      date: new Date(cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

const POSITIVE_VALUE_COLOR = '#10b981';
const NEGATIVE_VALUE_COLOR = '#ef4444';
const INVESTED_COLOR = '#6366f1';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold text-xs">
          {p.name}: {formatCurrencyCompact(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function NetWorthChart() {
  const { data, prices } = usePortfolio();
  const allData = useMemo(() => buildMonthlyInvestedData(data, prices), [data, prices]);
  const [rangeMonths, setRangeMonths] = useState(null);
  const [showInvested, setShowInvested] = useState(false);

  const chartData = useMemo(() => {
    if (!rangeMonths) return allData;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - rangeMonths);
    return allData.filter(d => d.date >= cutoff);
  }, [allData, rangeMonths]);
  const latestGain = chartData[chartData.length - 1]?.gain || 0;
  const valueColor = latestGain >= 0 ? POSITIVE_VALUE_COLOR : NEGATIVE_VALUE_COLOR;

  if (allData.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        Add transactions to see your investment timeline.
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
          {DATE_RANGES.map(({ label, months }) => (
            <button
              key={label}
              onClick={() => setRangeMonths(months)}
              aria-pressed={rangeMonths === months}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                rangeMonths === months
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowInvested(prev => !prev)}
          aria-pressed={showInvested}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
            showInvested
              ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700'
              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: INVESTED_COLOR }} />
          {showInvested ? 'Hide Invested' : 'Show Invested'}
        </button>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-700" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={v => formatCurrencyCompact(v)} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" tickLine={false} axisLine={false} width={52} />
             <Tooltip content={<CustomTooltip />} />
             <Legend wrapperStyle={{ fontSize: 11 }} />
             <Bar dataKey="invested" name="Invested" fill={INVESTED_COLOR} radius={[4, 4, 0, 0]} />
             <Area dataKey="gain" name="Gain / Loss" fill={valueColor} fillOpacity={0.18} stroke={false} />
             <Line
               type="monotone"
               dataKey="value"
               name="Current Value"
               stroke={valueColor}
               strokeWidth={2}
               dot={({ payload, ...props }) => (payload.txCount > 0 ? <circle {...props} r={3} fill={valueColor} /> : null)}
               activeDot={{ r: 4, fill: valueColor }}
             />
             {showInvested && (
               <Line type="monotone" dataKey="invested" name="Invested Trend" stroke={INVESTED_COLOR} strokeWidth={2} strokeDasharray="4 2" dot={false} activeDot={{ r: 4, fill: INVESTED_COLOR }} />
             )}
           </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
