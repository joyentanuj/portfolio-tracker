import React from 'react';
import DashboardSummary from '../components/Dashboard/DashboardSummary';
import PortfolioChart from '../components/Dashboard/PortfolioChart';
import TopPerformers from '../components/Dashboard/TopPerformers';
import Card from '../components/Common/Card';
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

export default function Dashboard() {
  const { getCategoryStats } = usePortfolio();
  const categories = ['stocks', 'usStocks', 'mutualFunds', 'fixedDeposits', 'gold', 'silver', 'cash', 'realEstate', 'others'];

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
          <div className="space-y-3">
            {categories.map(cat => {
              const stats = getCategoryStats(cat);
              if (stats.count === 0 && stats.totalValue === 0) return null;
              return (
                <Link
                  key={cat}
                  to={CATEGORY_PATHS[cat]}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: CATEGORY_COLORS[cat] + '33' }}
                  >
                    {CATEGORY_ICONS[cat]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                    <p className="text-gray-400 text-xs">{stats.count} assets</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 text-sm font-semibold">{formatCurrency(stats.totalValue)}</p>
                    <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.pnl >= 0 ? '+' : ''}{formatPercent(stats.pnlPercent)}
                    </p>
                  </div>
                  {stats.xirr !== null && (
                    <div className="text-right ml-2 hidden sm:block">
                      <p className="text-gray-400 text-[10px]">XIRR</p>
                      <p className={`text-xs font-medium ${stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatXIRR(stats.xirr)}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card title="Top Performers">
        <TopPerformers />
      </Card>
    </div>
  );
}
