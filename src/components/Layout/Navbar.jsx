import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useLivePrices } from '../../hooks/useLivePrices';
import { formatCurrency } from '../../utils/formatters';

export default function Navbar({ onMenuClick, title }) {
  const { getPortfolioStats, lastUpdated } = usePortfolio();
  const { fetchPrices } = useLivePrices();
  const stats = getPortfolioStats();

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
      >
        ☰
      </button>

      <h1 className="text-white font-semibold text-base flex-1">{title}</h1>

      <div className="hidden sm:flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Portfolio Value</p>
          <p className="text-white font-bold">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className={`text-right ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Today's P&L</p>
          <p className="font-semibold">{stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}</p>
        </div>
      </div>

      <button
        onClick={fetchPrices}
        title="Refresh prices"
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
      >
        🔄
      </button>

      {lastUpdated && (
        <span className="hidden md:block text-gray-600 text-[10px]">
          Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </header>
  );
}
