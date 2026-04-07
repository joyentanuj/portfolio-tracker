import React, { useState } from 'react';
import Card from '../components/Common/Card';
import StatCard from '../components/Common/StatCard';
import FDsList from '../components/Assets/FDsList';
import PPFList from '../components/Assets/PPFList';
import EPFOList from '../components/Assets/EPFOList';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatXIRR } from '../utils/formatters';

export default function FixedDeposits() {
  const { getCategoryStats } = usePortfolio();
  const [activeTab, setActiveTab] = useState('fd');

  const fdStats = getCategoryStats('fixedDeposits');
  const ppfStats = getCategoryStats('ppf');
  const epfoStats = getCategoryStats('epfo');

  const combined = {
    totalValue: fdStats.totalValue + ppfStats.totalValue + epfoStats.totalValue,
    totalInvested: fdStats.totalInvested + ppfStats.totalInvested + epfoStats.totalInvested,
    pnl: fdStats.pnl + ppfStats.pnl + epfoStats.pnl,
  };

  const tabs = [
    { key: 'fd', label: 'Fixed Deposits', icon: '🏛️', count: fdStats.count },
    { key: 'ppf', label: 'PPF', icon: '🏦', count: ppfStats.count },
    { key: 'epfo', label: 'EPFO / EPF', icon: '👷', count: epfoStats.count },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Value" value={formatCurrency(combined.totalValue)} color="text-gray-900 dark:text-gray-100" />
        <StatCard label="Total Invested" value={formatCurrency(combined.totalInvested)} color="text-gray-900 dark:text-gray-100" />
        <StatCard
          label="Interest / Gain"
          value={`${combined.pnl >= 0 ? '+' : ''}${formatCurrency(combined.pnl)}`}
          color={combined.pnl >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <StatCard
          label="Avg XIRR (FD)"
          value={formatXIRR(fdStats.xirr)}
          color={fdStats.xirr !== null && fdStats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === tab.key
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'fd' && (
        <Card title="Fixed Deposits">
          <FDsList />
        </Card>
      )}
      {activeTab === 'ppf' && (
        <Card title="PPF Accounts">
          <PPFList />
        </Card>
      )}
      {activeTab === 'epfo' && (
        <Card title="EPFO / EPF">
          <EPFOList />
        </Card>
      )}
    </div>
  );
}
