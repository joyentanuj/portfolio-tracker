import React, { useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrencyCompact } from '../../utils/formatters';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthlyReturns(data, prices) {
  const FALLBACK_USD_INR = 85.0;
  const usdInrRate = prices['USDINR=X']?.price || FALLBACK_USD_INR;
  const txCategories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];

  // Collect all asset holdings
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
      if (txs.length > 0) assetHoldings.push({ txs, livePrice, fxRate });
    }
  }

  if (assetHoldings.length === 0) return [];

  const now = new Date();
  const startYear = now.getFullYear() - 1;
  const months = [];

  let prevValue = null;
  for (let year = startYear; year <= now.getFullYear(); year++) {
    const maxMonth = year === now.getFullYear() ? now.getMonth() : 11;
    for (let month = 0; month <= maxMonth; month++) {
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      let value = 0;
      for (const h of assetHoldings) {
        let units = 0;
        for (const tx of h.txs) {
          if (tx.date <= monthEnd) units += tx.type === 'buy' ? tx.quantity : -tx.quantity;
        }
        value += Math.max(0, units) * h.livePrice * h.fxRate;
      }
      const returnPct = prevValue !== null && prevValue > 0
        ? ((value - prevValue) / prevValue) * 100
        : null;
      months.push({ year, month, label: MONTH_LABELS[month], value, returnPct });
      prevValue = value;
    }
  }
  return months;
}

function getColor(pct) {
  if (pct === null) return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-300 dark:text-gray-600' };
  if (pct > 5) return { bg: 'bg-green-600', text: 'text-white' };
  if (pct > 2) return { bg: 'bg-green-400', text: 'text-white' };
  if (pct > 0) return { bg: 'bg-green-200 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' };
  if (pct > -2) return { bg: 'bg-red-200 dark:bg-red-900', text: 'text-red-800 dark:text-red-300' };
  if (pct > -5) return { bg: 'bg-red-400', text: 'text-white' };
  return { bg: 'bg-red-600', text: 'text-white' };
}

export default function MonthlyReturnsHeatmap() {
  const { data, prices } = usePortfolio();
  const months = useMemo(() => buildMonthlyReturns(data, prices), [data, prices]);

  if (months.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-500 text-sm">
        Add transactions to see monthly returns.
      </div>
    );
  }

  // Group by year
  const byYear = {};
  for (const m of months) {
    if (!byYear[m.year]) byYear[m.year] = {};
    byYear[m.year][m.month] = m;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Month labels header */}
        <div className="grid grid-cols-13 gap-1 mb-1" style={{ gridTemplateColumns: '36px repeat(12, 1fr)' }}>
          <div />
          {MONTH_LABELS.map(m => (
            <div key={m} className="text-center text-[9px] text-gray-400 dark:text-gray-500 font-medium">{m}</div>
          ))}
        </div>

        {/* Year rows */}
        {Object.entries(byYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, monthData]) => (
          <div key={year} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '36px repeat(12, 1fr)' }}>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium flex items-center">{year}</div>
            {MONTH_LABELS.map((_, mi) => {
              const cell = monthData[mi];
              const pct = cell?.returnPct ?? null;
              const { bg, text } = getColor(pct);
              return (
                <div
                  key={mi}
                  title={pct !== null ? `${MONTH_LABELS[mi]} ${year}: ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}% (${formatCurrencyCompact(cell.value)})` : 'No data'}
                  className={`h-6 rounded text-[8px] font-semibold flex items-center justify-center transition-all cursor-default hover:opacity-80 ${bg} ${text}`}
                >
                  {pct !== null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : ''}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[9px] text-gray-400 dark:text-gray-500">Returns:</span>
          {[
            { label: '>+5%', bg: 'bg-green-600' },
            { label: '+2-5%', bg: 'bg-green-400' },
            { label: '0-2%', bg: 'bg-green-200' },
            { label: '0 to -2%', bg: 'bg-red-200' },
            { label: '-2 to -5%', bg: 'bg-red-400' },
            { label: '<-5%', bg: 'bg-red-600' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-0.5">
              <div className={`w-3 h-3 rounded ${l.bg}`} />
              <span className="text-[9px] text-gray-400 dark:text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
