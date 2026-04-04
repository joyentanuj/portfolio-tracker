import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_LABELS } from '../../utils/constants';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function TopPerformers() {
  const { data, getAssetStats } = usePortfolio();

  const allAssets = [];
  const transactionalCategories = ['stocks', 'mutualFunds', 'gold', 'silver'];

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
  const gainers = sorted.filter(a => a.pnl > 0).slice(0, 5);
  const losers = [...sorted].reverse().filter(a => a.pnl < 0).slice(0, 5);

  const AssetRow = ({ asset, isGainer }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-gray-900 text-sm font-medium truncate">{asset.name}</p>
        <p className="text-gray-400 text-xs">{asset.category}</p>
      </div>
      <div className="text-right ml-3">
        <p className={`text-sm font-semibold ${isGainer ? 'text-green-600' : 'text-red-600'}`}>
          {isGainer ? '+' : ''}{formatPercent(asset.pnlPercent)}
        </p>
        <p className={`text-xs ${isGainer ? 'text-green-500' : 'text-red-500'}`}>
          {isGainer ? '+' : ''}{formatCurrency(asset.pnl)}
        </p>
      </div>
    </div>
  );

  if (allAssets.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        Add stocks, mutual funds, gold or silver to see top performers.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-green-600 font-semibold text-sm mb-3 flex items-center gap-2">
          <span>📈</span> Top Gainers
        </h4>
        {gainers.length > 0
          ? gainers.map((a, i) => <AssetRow key={i} asset={a} isGainer />)
          : <p className="text-gray-400 text-sm">No gainers yet</p>}
      </div>
      <div>
        <h4 className="text-red-600 font-semibold text-sm mb-3 flex items-center gap-2">
          <span>📉</span> Top Losers
        </h4>
        {losers.length > 0
          ? losers.map((a, i) => <AssetRow key={i} asset={a} isGainer={false} />)
          : <p className="text-gray-400 text-sm">No losers</p>}
      </div>
    </div>
  );
}
