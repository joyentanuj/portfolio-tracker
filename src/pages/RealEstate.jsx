import React from 'react';
import Card from '../components/Common/Card';
import StatCard from '../components/Common/StatCard';
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
          { label: 'Current Value', value: formatCurrency(stats.totalValue), color: 'text-orange-600' },
          { label: 'Purchase Price', value: formatCurrency(stats.totalInvested), color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Appreciation', value: `${stats.pnl >= 0 ? '+' : ''}${formatCurrency(stats.pnl)}`, color: stats.pnl >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'CAGR', value: formatXIRR(stats.xirr), color: 'text-orange-600' },
        ].map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>
      <Card title="Real Estate">
        <RealEstateComponent />
      </Card>
    </div>
  );
}
