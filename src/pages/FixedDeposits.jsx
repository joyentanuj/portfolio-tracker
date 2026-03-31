import React from 'react';
import Card from '../components/Common/Card';
import FDsList from '../components/Assets/FDsList';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatXIRR } from '../utils/formatters';

export default function FixedDeposits() {
  const { getCategoryStats } = usePortfolio();
  const stats = getCategoryStats('fixedDeposits');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Current Value', value: formatCurrency(stats.totalValue), color: 'text-white' },
          { label: 'Principal', value: formatCurrency(stats.totalInvested), color: 'text-white' },
          { label: 'Interest Earned', value: `${stats.pnl >= 0 ? '+' : ''}${formatCurrency(stats.pnl)}`, color: stats.pnl >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Avg XIRR', value: formatXIRR(stats.xirr), color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <Card title="🏛️ Fixed Deposits">
        <FDsList />
      </Card>
    </div>
  );
}
