import React from 'react';
import DashboardSummary from '../components/Dashboard/DashboardSummary';
import PortfolioChart from '../components/Dashboard/PortfolioChart';
import TopPerformers from '../components/Dashboard/TopPerformers';
import Card from '../components/Common/Card';
import { SkeletonRow } from '../components/Common/Skeleton';
import { usePortfolio } from '../context/PortfolioContext';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/constants';
import { formatCurrency, formatXIRR, formatPercent } from '../utils/formatters';
import { Link } from 'react-router-dom';

const CATEGORY_PATHS = {
  stocks: '/stocks',
  usStocks: '/us-stocks',
  mutualFunds: '/mutual-funds',
  fixedDeposits: '/fixed-deposits',
  gold: '/gold-silver',
  silver: '/gold-silver',
  cash: '/cash',
  realEstate: '/real-estate',
  others: '/others',
};

function MiniTrend({ positive, neutral }) {
  if (neutral) {
    return (
      <svg width="40" height="20" viewBox="0 0 40 20" className="shrink-0">
        <polyline points="0,10 40,10" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (positive) {
    return (
      <svg width="40" height="20" viewBox="0 0 40 20" className="shrink-0">
        <polyline points="0,18 10,14 20,10 30,6 40,2" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="40" height="20" viewBox="0 0 40 20" className="shrink-0">
      <polyline points="0,2 10,6 20,10 30,14 40,18" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const { getPortfolioStats, prices } = usePortfolio();
  const portfolioStats = getPortfolioStats();
  const categories = ['stocks', 'usStocks', 'mutualFunds', 'fixedDeposits', 'gold', 'silver', 'cash', 'realEstate', 'others'];

  const pricesLoaded = Object.keys(prices).length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <DashboardSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <Card title="Portfolio Allocation">
          <PortfolioChart />
        </Card>

        {/* Category Breakdown */}
        <Card title="Category Breakdown">
          {!pricesLoaded ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => {
                const stats = portfolioStats.categoryBreakdown[cat];
                if (!stats || (stats.count === 0 && stats.totalValue === 0)) return null;
                const isPositive = stats.pnl > 0;
                const isNeutral = stats.pnl === 0;
                return (
                  <Link
                    key={cat}
                    to={CATEGORY_PATHS[cat]}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: CATEGORY_COLORS[cat] + '33' }}
                    >
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">{stats.count} assets</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-gray-100 text-sm font-semibold">{formatCurrency(stats.totalValue)}</p>
                      <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.pnl >= 0 ? '+' : ''}{formatPercent(stats.pnlPercent)}
                      </p>
                    </div>
                    <MiniTrend positive={isPositive} neutral={isNeutral} />
                    {stats.xirr !== null && (
                      <div className="text-right ml-2 hidden sm:block">
                        <p className="text-gray-400 dark:text-gray-500 text-[10px]">XIRR</p>
                        <p className={`text-xs font-medium ${stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatXIRR(stats.xirr)}
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Top Performers */}
      <Card title="Top Performers">
        <TopPerformers />
      </Card>
    </div>
  );
}
