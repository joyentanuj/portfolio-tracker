import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_LABELS } from '../../utils/constants';
import { formatCurrency, formatPercent } from '../../utils/formatters';

function AssetRow({ asset, isGainer, maxPct }) {
  const barWidth = maxPct > 0 ? Math.min((Math.abs(asset.pnlPercent) / maxPct) * 100, 100) : 0;
  return (
    <div className="py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="min-w-0 flex-1">
          <p className="text-gray-900 dark:text-gray-100 text-sm font-medium truncate">{asset.name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{asset.category}</p>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className={`text-sm font-semibold ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
            {isGainer ? '+' : ''}{formatPercent(asset.pnlPercent)}
          </p>
          <p className={`text-xs ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
            {isGainer ? '+' : ''}{formatCurrency(asset.pnl)}
          </p>
        </div>
      </div>
      {/* P&L magnitude bar */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isGainer ? 'bg-green-400' : 'bg-red-400'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function GainersList({ gainers, maxGainerPct }) {
  return (
    <div>
      <h4 className="text-green-600 font-semibold text-sm mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> Top Gainers
      </h4>
      {gainers.length > 0
        ? gainers.map((a, i) => <AssetRow key={i} asset={a} isGainer maxPct={maxGainerPct} />)
        : <p className="text-gray-400 dark:text-gray-500 text-sm">No gainers yet</p>}
    </div>
  );
}

function LosersList({ losers, maxLoserPct }) {
  return (
    <div>
      <h4 className="text-red-600 font-semibold text-sm mb-3 flex items-center gap-2">
        <TrendingDown className="w-4 h-4" /> Top Losers
      </h4>
      {losers.length > 0
        ? losers.map((a, i) => <AssetRow key={i} asset={a} isGainer={false} maxPct={maxLoserPct} />)
        : <p className="text-gray-400 dark:text-gray-500 text-sm">No losers</p>}
    </div>
  );
}

export default function TopPerformers() {
  const { data, getAssetStats } = usePortfolio();
  const [tab, setTab] = useState('gainers');

  const allAssets = [];
  const transactionalCategories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];

  for (const cat of transactionalCategories) {
    for (const asset of (data[cat] || [])) {
      const stats = getAssetStats(asset, cat);
      if (stats.currentValue > 0) {
        allAssets.push({
          name: asset.name || asset.symbol || asset.schemeName || 'Unknown',
          category: CATEGORY_LABELS[cat],
          pnl: stats.pnl,
          pnlPercent: stats.pnlPercent,
          currentValue: stats.currentValue,
        });
      }
    }
  }

  const sorted = [...allAssets].sort((a, b) => b.pnlPercent - a.pnlPercent);
  const gainers = sorted.filter(a => a.pnl > 0).slice(0, 10);
  const losers = [...sorted].reverse().filter(a => a.pnl < 0).slice(0, 10);

  const maxGainerPct = Math.abs(gainers[0]?.pnlPercent ?? 1);
  const maxLoserPct = Math.abs(losers[0]?.pnlPercent ?? 1);

  if (allAssets.length === 0) {
    return (
      <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
        Add stocks, mutual funds, gold or silver to see top performers.
      </div>
    );
  }

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'gainers', label: 'Gainers', count: gainers.length },
          { key: 'losers', label: 'Losers', count: losers.length },
          { key: 'all', label: 'All', count: allAssets.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === t.key
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t.label}
            <span className={`${tab === t.key ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} rounded-full px-1.5 py-0.5 text-[10px] font-bold`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GainersList gainers={gainers} maxGainerPct={maxGainerPct} />
          <LosersList losers={losers} maxLoserPct={maxLoserPct} />
        </div>
      ) : tab === 'gainers' ? (
        <GainersList gainers={gainers} maxGainerPct={maxGainerPct} />
      ) : (
        <LosersList losers={losers} maxLoserPct={maxLoserPct} />
      )}
    </div>
  );
}
