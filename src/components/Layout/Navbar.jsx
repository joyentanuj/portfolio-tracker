import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useLivePrices } from '../../hooks/useLivePrices';
import { formatCurrency } from '../../utils/formatters';

export default function Navbar({ onMenuClick, title, isDark, onToggleDark }) {
  const { getPortfolioStats, getDailyChange, lastUpdated } = usePortfolio();
  const { fetchPrices } = useLivePrices();
  const stats = getPortfolioStats();
  const todayPnl = getDailyChange();
  const todayPnlPercent = stats.totalValue > 0 ? (todayPnl / (stats.totalValue - todayPnl)) * 100 : 0;

  // Freshness indicator
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const secondsAgo = lastUpdated ? Math.floor((now - lastUpdated.getTime()) / 1000) : null;
  const freshnessColor = secondsAgo === null
    ? 'bg-gray-300 dark:bg-gray-600'
    : secondsAgo < 30
    ? 'bg-green-400 animate-pulse'
    : secondsAgo < 120
    ? 'bg-amber-400'
    : 'bg-gray-400 dark:bg-gray-600';

  const freshnessLabel = secondsAgo === null
    ? 'Never updated'
    : secondsAgo < 60
    ? `Updated ${secondsAgo}s ago`
    : `Updated ${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        ☰
      </button>

      <h1 className="text-gray-900 dark:text-gray-100 font-semibold text-base flex-1">{title}</h1>

      <div className="hidden sm:flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">Portfolio Value</p>
          <p className="text-gray-900 dark:text-gray-100 font-bold">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className={`text-right ${todayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">Today's P&L</p>
          <p className="font-semibold">{todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}</p>
          {todayPnlPercent !== 0 && (
            <p className="text-[10px]">{todayPnl >= 0 ? '+' : ''}{todayPnlPercent.toFixed(2)}%</p>
          )}
        </div>
      </div>

      {/* Freshness indicator */}
      <div className="hidden md:flex items-center gap-1.5" title={freshnessLabel}>
        <div className={`w-2 h-2 rounded-full ${freshnessColor}`} />
        <span className="text-gray-400 dark:text-gray-500 text-[10px]">{freshnessLabel}</span>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <button
        onClick={fetchPrices}
        title="Refresh prices"
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
      >
        🔄
      </button>
    </header>
  );
}
