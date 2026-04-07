import React from 'react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatters';
import { useCountUp } from '../../hooks/useCountUp';
import { SkeletonCard } from '../Common/Skeleton';

function TrendBadge({ value }) {
  if (value === null || value === undefined) return null;
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 mt-1">
      <ChevronUp className="w-3 h-3" /> Trending up
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 dark:text-red-400 mt-1">
      <ChevronDown className="w-3 h-3" /> Trending down
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 mt-1">
      <Minus className="w-3 h-3" /> No change
    </span>
  );
}

function AnimatedStatCard({ label, rawValue, formatter, sub, positive, neutral = false, large = false, trend, children }) {
  const animated = useCountUp(rawValue ?? 0);
  const color = neutral ? 'text-gray-900 dark:text-gray-100' : positive ? 'text-green-500' : 'text-red-500';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-bold ${large ? 'text-2xl' : 'text-xl'} ${color}`}>{formatter(animated)}</p>
      {sub && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{sub}</p>}
      <TrendBadge value={trend} />
      {children}
    </div>
  );
}

export default function DashboardSummary() {
  const { getPortfolioStats, getDailyChange, prices } = usePortfolio();
  const stats = getPortfolioStats();
  const { totalValue, totalInvested, pnl, pnlPercent, xirr } = stats;

  const pnlPositive = pnl >= 0;
  const todayPnl = getDailyChange();
  const todayPositive = todayPnl >= 0;
  const todayPnlPercent = totalValue > 0 ? (todayPnl / (totalValue - todayPnl)) * 100 : 0;

  const pricesLoaded = Object.keys(prices).length > 0;
  const showSkeleton = !pricesLoaded && totalValue === 0;

  if (showSkeleton) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SkeletonCard large />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Progress bar for Portfolio Value card
  const investedPct = totalValue > 0 ? Math.min((totalInvested / totalValue) * 100, 100) : 100;
  const gainPct = 100 - investedPct;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <AnimatedStatCard
        label="Portfolio Value"
        rawValue={totalValue}
        formatter={formatCurrencyCompact}
        sub={formatCurrency(totalValue)}
        positive
        neutral
        large
      >
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
            <span>Invested</span>
            <span>Gains</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-500 transition-all duration-700 rounded-l-full"
              style={{ width: `${investedPct}%` }}
            />
            <div
              className={`h-full transition-all duration-700 rounded-r-full ${pnlPositive ? 'bg-green-400' : 'bg-red-400'}`}
              style={{ width: `${gainPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-gray-500 dark:text-gray-400">{formatCurrencyCompact(totalInvested)}</span>
            <span className={pnlPositive ? 'text-green-500' : 'text-red-500'}>{pnlPositive ? '+' : ''}{formatCurrencyCompact(pnl)}</span>
          </div>
        </div>
      </AnimatedStatCard>
      <AnimatedStatCard
        label="Total Invested"
        rawValue={totalInvested}
        formatter={formatCurrencyCompact}
        sub={formatCurrency(totalInvested)}
        neutral
      />
      <AnimatedStatCard
        label="Total P&L"
        rawValue={pnl}
        formatter={(v) => `${v >= 0 ? '+' : ''}${formatCurrencyCompact(v)}`}
        sub={`${pnlPositive ? '+' : ''}${(pnlPercent * 100).toFixed(2)}% returns`}
        positive={pnlPositive}
        trend={pnl}
      />
      <AnimatedStatCard
        label="Today's P&L"
        rawValue={todayPnl}
        formatter={(v) => `${v >= 0 ? '+' : ''}${formatCurrencyCompact(v)}`}
        sub={`${todayPositive ? '+' : ''}${todayPnlPercent.toFixed(2)}% today`}
        positive={todayPositive}
        neutral={todayPnl === 0}
        trend={todayPnl}
      />
      <AnimatedStatCard
        label="Overall XIRR"
        rawValue={xirr !== null ? xirr * 100 : 0}
        formatter={(v) => xirr === null ? 'N/A' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
        sub="Annualised return"
        positive={xirr !== null && xirr >= 0}
        neutral={xirr === null}
        trend={xirr}
      />
    </div>
  );
}
