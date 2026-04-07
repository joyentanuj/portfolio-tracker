import React from 'react';
import Card from '../components/Common/Card';
import StatCard from '../components/Common/StatCard';
import CashHoldings from '../components/Assets/CashHoldings';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency } from '../utils/formatters';

export default function Cash() {
  const { getCategoryStats } = usePortfolio();
  const stats = getCategoryStats('cash');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Cash', value: formatCurrency(stats.totalValue), color: 'text-green-600' },
          { label: 'Accounts', value: `${stats.count}`, color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Portfolio %', value: `${stats.totalValue > 0 ? '--' : '0%'}`, color: 'text-gray-500' },
        ].map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>
      <Card title="Cash & Savings">
        <CashHoldings />
      </Card>
    </div>
  );
}
