import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';
import DashboardSummary from '../components/Dashboard/DashboardSummary';
import PortfolioChart from '../components/Dashboard/PortfolioChart';
import NetWorthChart from '../components/Dashboard/NetWorthChart';
import TopPerformers from '../components/Dashboard/TopPerformers';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import PortfolioHealthScore from '../components/Dashboard/PortfolioHealthScore';
import RebalancingSuggestions from '../components/Dashboard/RebalancingSuggestions';
import MonthlyReturnsHeatmap from '../components/Dashboard/MonthlyReturnsHeatmap';
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

const SORT_OPTIONS = [
  { value: 'value', label: 'By Value' },
  { value: 'pnlPct', label: 'By P&L%' },
  { value: 'xirr', label: 'By XIRR' },
];

const ALL_CATEGORIES = ['stocks', 'usStocks', 'mutualFunds', 'fixedDeposits', 'gold', 'silver', 'cash', 'realEstate', 'others'];

export default function Dashboard() {
  const { getPortfolioStats, prices } = usePortfolio();
  const portfolioStats = getPortfolioStats();
  const [sortBy, setSortBy] = useState('value');

  const pricesLoaded = Object.keys(prices).length > 0;

  const sortedCategories = useMemo(() => {
    const active = ALL_CATEGORIES.filter(cat => {
      const s = portfolioStats.categoryBreakdown[cat];
      return s && (s.count > 0 || s.totalValue > 0);
    });
    return [...active].sort((a, b) => {
      const sa = portfolioStats.categoryBreakdown[a];
      const sb = portfolioStats.categoryBreakdown[b];
      if (sortBy === 'value') return (sb.totalValue || 0) - (sa.totalValue || 0);
      if (sortBy === 'pnlPct') return (sb.pnlPercent || 0) - (sa.pnlPercent || 0);
      if (sortBy === 'xirr') return ((sb.xirr || 0) - (sa.xirr || 0));
      return 0;
    });
  }, [portfolioStats, sortBy]);

  // Identify best and worst performers
  const activeWithStats = sortedCategories.map(cat => ({
    cat,
    stats: portfolioStats.categoryBreakdown[cat],
  })).filter(({ stats }) => stats && stats.totalValue > 0);

  const bestCat = activeWithStats.length > 0
    ? activeWithStats.reduce((best, cur) => cur.stats.pnlPercent > best.stats.pnlPercent ? cur : best, activeWithStats[0])?.cat
    : null;
  const worstCat = activeWithStats.length > 0
    ? activeWithStats.reduce((worst, cur) => cur.stats.pnlPercent < worst.stats.pnlPercent ? cur : worst, activeWithStats[0])?.cat
    : null;

  return (
    <div className="space-y-8">
      {/* Quick Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-base">Overview</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Your portfolio at a glance</p>
        </div>
        <QuickActions />
      </div>

      {/* Summary Cards */}
      <DashboardSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <Card title="Portfolio Allocation">
          <PortfolioChart />
        </Card>

        {/* Category Breakdown */}
        <Card
          title="Category Breakdown"
          action={
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                aria-label="Sort categories"
                className="text-xs text-gray-600 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          }
        >
          {!pricesLoaded ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCategories.map(cat => {
                const stats = portfolioStats.categoryBreakdown[cat];
                if (!stats || (stats.count === 0 && stats.totalValue === 0)) return null;
                const isPositive = stats.pnl > 0;
                const isNeutral = stats.pnl === 0;
                const isBest = cat === bestCat && stats.pnl > 0;
                const isWorst = cat === worstCat && stats.pnl < 0;
                return (
                  <Link
                    key={cat}
                    to={CATEGORY_PATHS[cat]}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-150 group border-l-4 hover:shadow-sm"
                    style={{ borderLeftColor: CATEGORY_COLORS[cat] }}
                    aria-label={`${CATEGORY_LABELS[cat]}: ${formatCurrency(stats.totalValue)}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: CATEGORY_COLORS[cat] + '22' }}
                    >
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                        {isBest && (
                          <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                            ★ Best
                          </span>
                        )}
                        {isWorst && (
                          <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                            ↓ Worst
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">{stats.count} assets</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-gray-100 text-sm font-semibold">{formatCurrency(stats.totalValue)}</p>
                      <p className={`text-xs font-medium ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.pnl >= 0 ? '+' : ''}{formatPercent(stats.pnlPercent)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 w-14">
                      <span className={`${isPositive ? 'text-green-500' : isNeutral ? 'text-gray-400' : 'text-red-500'}`}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNeutral ? <Minus className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      </span>
                      <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${portfolioStats.totalValue > 0 ? (stats.totalValue / portfolioStats.totalValue) * 100 : 0}%`,
                            background: CATEGORY_COLORS[cat],
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {portfolioStats.totalValue > 0 ? ((stats.totalValue / portfolioStats.totalValue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
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

      {/* Investment Timeline */}
      <Card title="Investment Timeline">
        <NetWorthChart />
      </Card>

      {/* Monthly Returns Heatmap */}
      <Card title="Monthly Returns Heatmap">
        <MonthlyReturnsHeatmap />
      </Card>

      {/* Recent Transactions + Portfolio Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Transactions">
          <RecentTransactions />
        </Card>
        <Card title="Portfolio Health">
          <PortfolioHealthScore />
        </Card>
      </div>

      {/* Rebalancing Suggestions */}
      <Card title="Rebalancing Suggestions">
        <RebalancingSuggestions />
      </Card>
    </div>
  );
}
