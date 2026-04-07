import React, { useEffect, useState } from 'react';
import { Menu, Moon, Sun, RefreshCw, Search } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useLivePrices } from '../../hooks/useLivePrices';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatters';
import GlobalSearch from '../Common/GlobalSearch';

export default function Navbar({ onMenuClick, title, isDark, onToggleDark }) {
  const { getPortfolioStats, getDailyChange, lastUpdated } = usePortfolio();
  const { fetchPrices } = useLivePrices();
  const stats = getPortfolioStats();
  const todayPnl = getDailyChange();
  const todayPnlPercent = stats.totalValue > 0 ? (todayPnl / (stats.totalValue - todayPnl)) * 100 : 0;
  const [searchOpen, setSearchOpen] = useState(false);

  // Freshness indicator
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
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
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-gray-900 dark:text-gray-100 font-semibold text-base flex-1">{title}</h1>

      {/* Search trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline font-mono text-[9px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-1 py-0.5 rounded">⌘K</kbd>
      </button>

      {/* Mobile: show just total value */}
      <div className="sm:hidden text-right">
        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{formatCurrencyCompact(stats.totalValue)}</p>
        <p className={`text-xs ${todayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {todayPnl >= 0 ? '+' : ''}{formatCurrencyCompact(todayPnl)} today
        </p>
      </div>

      {/* Desktop: show full stats */}
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
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <button
        onClick={fetchPrices}
        title="Refresh prices"
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
