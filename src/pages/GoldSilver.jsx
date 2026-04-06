import React from 'react';
import Card from '../components/Common/Card';
import GoldSilverComponent from '../components/Assets/GoldSilver';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function GoldSilverPage() {
  const { getCategoryStats, getAssetStats, data } = usePortfolio();
  const goldStats = getCategoryStats('gold');
  const silverStats = getCategoryStats('silver');

  // Total grams across all gold holdings
  const totalGoldGrams = (data.gold || []).reduce((sum, asset) => {
    const stats = getAssetStats(asset, 'gold');
    return sum + (stats.totalUnits || 0);
  }, 0);

  const combined = {
    totalValue: goldStats.totalValue + silverStats.totalValue,
    totalInvested: goldStats.totalInvested + silverStats.totalInvested,
    pnl: goldStats.pnl + silverStats.pnl,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Gold (gm)', value: `${formatNumber(totalGoldGrams, 4)} gm`, color: 'text-amber-600' },
          { label: 'Combined Value', value: formatCurrency(combined.totalValue), color: 'text-amber-600' },
          { label: 'Invested', value: formatCurrency(combined.totalInvested), color: 'text-gray-900' },
          { label: 'P&L', value: `${combined.pnl >= 0 ? '+' : ''}${formatCurrency(combined.pnl)}`, color: combined.pnl >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <Card title="🥇 Gold & Silver Holdings">
        <GoldSilverComponent />
      </Card>
    </div>
  );
}

