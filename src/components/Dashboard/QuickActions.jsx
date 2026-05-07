import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, BarChart2, Download, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useLivePrices } from '../../hooks/useLivePrices';

function exportPortfolioData(data, portfolioStats) {
  const rows = [['Category', 'Asset', 'Value (INR)', 'Invested (INR)', 'P&L (INR)', 'P&L %']];
  const categories = ['stocks', 'usStocks', 'mutualFunds', 'fixedDeposits', 'gold', 'silver', 'cash', 'realEstate', 'others'];
  const catLabels = {
    stocks: 'Indian Stocks', usStocks: 'US Stocks', mutualFunds: 'Mutual Funds',
    fixedDeposits: 'Fixed Deposits', gold: 'Gold', silver: 'Silver',
    cash: 'Cash', realEstate: 'Real Estate', others: 'Others',
  };

  for (const cat of categories) {
    const catStats = portfolioStats.categoryBreakdown[cat];
    if (!catStats || catStats.totalValue === 0) continue;
    rows.push([
      catLabels[cat],
      'Total',
      catStats.totalValue.toFixed(2),
      catStats.totalInvested.toFixed(2),
      catStats.pnl.toFixed(2),
      catStats.totalInvested > 0 ? ((catStats.pnl / catStats.totalInvested) * 100).toFixed(2) + '%' : '0%',
    ]);
    for (const asset of (data[cat] || [])) {
      const name = asset.name || asset.symbol || asset.schemeName || asset.bankName || 'Unknown';
      rows.push([catLabels[cat], name, '', '', '', '']);
    }
  }

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QuickActions() {
  const { data, getPortfolioStats, showToast } = usePortfolio();
  const { fetchPrices } = useLivePrices();
  const navigate = useNavigate();

  const handleExport = () => {
    const stats = getPortfolioStats();
    exportPortfolioData(data, stats);
    showToast('Portfolio data exported successfully');
  };

  const handleRefresh = async () => {
    await fetchPrices();
    showToast('Prices refreshed');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => navigate('/stocks')}
        aria-label="Add transaction"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        <span>Add Transaction</span>
      </button>

      <Link
        to="/stocks"
        aria-label="View reports"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <BarChart2 className="w-3.5 h-3.5" />
        <span>View Reports</span>
      </Link>

      <button
        onClick={handleExport}
        aria-label="Export data as CSV"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export Data</span>
      </button>

      <button
        onClick={handleRefresh}
        aria-label="Refresh prices"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Refresh Prices</span>
      </button>
    </div>
  );
}
