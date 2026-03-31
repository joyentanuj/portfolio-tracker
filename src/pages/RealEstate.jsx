import React from 'react';
import Card from '../components/Common/Card';
import RealEstateComponent from '../components/Assets/RealEstate';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatXIRR } from '../utils/formatters';

export default function RealEstate() {
  const { getCategoryStats } = usePortfolio();
  const stats = getCategoryStats('realEstate');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Current Value', value: formatCurrency(stats.totalValue), color: 'text-orange-400' },
          { label: 'Purchase Price', value: formatCurrency(stats.totalInvested), color: 'text-white' },
          { label: 'Appreciation', value: `${stats.pnl >= 0 ? '+' : ''}${formatCurrency(stats.pnl)}`, color: stats.pnl >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'CAGR', value: formatXIRR(stats.xirr), color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <Card title="🏠 Real Estate">
        <RealEstateComponent />
      </Card>
    </div>
  );
}
