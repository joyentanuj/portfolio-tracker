import React from 'react';
import Card from '../components/Common/Card';
import StatCard from '../components/Common/StatCard';
import MutualFundsList from '../components/Assets/MutualFundsList';
import { usePortfolio } from '../context/PortfolioContext';
import AdvancedFilters from '../components/Common/AdvancedFilters';
import { useFilters } from '../hooks/useFilters';
import { CATEGORY_LABELS } from '../utils/constants';
import { formatCurrency, formatXIRR } from '../utils/formatters';

export default function MutualFunds() {
  const { getCategoryStats } = usePortfolio();
  const { filters, setFilters, clearFilters } = useFilters();

  const stats = getCategoryStats('mutualFunds');

  return (
    <div className="space-y-6">
      <AdvancedFilters
        categories={[{ value: 'all', label: CATEGORY_LABELS.mutualFunds }]}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Current Value', value: formatCurrency(stats.totalValue), color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Invested', value: formatCurrency(stats.totalInvested), color: 'text-gray-900 dark:text-gray-100' },
          { label: 'P&L', value: `${stats.pnl >= 0 ? '+' : ''}${formatCurrency(stats.pnl)}`, color: stats.pnl >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'XIRR', value: formatXIRR(stats.xirr), color: stats.xirr !== null && stats.xirr >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>
      <Card title="Mutual Funds Portfolio">
        <MutualFundsList />
      </Card>
    </div>
  );
}
