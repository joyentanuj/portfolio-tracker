import React from 'react';
import Card from '../components/Common/Card';
import GoldSilverComponent from '../components/Assets/GoldSilver';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatXIRR } from '../utils/formatters';

export default function GoldSilverPage() {
  const { getCategoryStats } = usePortfolio();
  const goldStats = getCategoryStats('gold');
  const silverStats = getCategoryStats('silver');

  const combined = {
    totalValue: goldStats.totalValue + silverStats.totalValue,
    totalInvested: goldStats.totalInvested + silverStats.totalInvested,
    pnl: goldStats.pnl + silverStats.pnl,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Combined Value', value: formatCurrency(combined.totalValue), color: 'text-amber-400' },
          { label: 'Invested', value: formatCurrency(combined.totalInvested), color: 'text-white' },
          { label: 'P&L', value: `${combined.pnl >= 0 ? '+' : ''}${formatCurrency(combined.pnl)}`, color: combined.pnl >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
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
