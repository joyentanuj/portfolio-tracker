import React from 'react';
import Card from '../components/Common/Card';
import USStocksList from '../components/Assets/USStocksList';
import { usePortfolio } from '../context/PortfolioContext';
import { formatXIRR } from '../utils/formatters';

function formatUSD(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function USStocks() {
  const { getCategoryStats, prices } = usePortfolio();
  const stats = getCategoryStats('usStocks');
  const usdInrRate = prices['USDINR=X']?.price || 85.0;

  const totalValueINR = stats.totalValue * usdInrRate;
  const totalInvestedINR = stats.totalInvested * usdInrRate;
  const pnlINR = stats.pnl * usdInrRate;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Current Value',
            value: formatUSD(stats.totalValue),
            sub: `≈ ₹${Math.round(totalValueINR).toLocaleString('en-IN')}`,
            color: 'text-gray-900',
          },
          {
            label: 'Invested',
            value: formatUSD(stats.totalInvested),
            sub: `≈ ₹${Math.round(totalInvestedINR).toLocaleString('en-IN')}`,
            color: 'text-gray-900',
          },
          {
            label: 'P&L',
            value: `${stats.pnl >= 0 ? '+' : ''}${formatUSD(stats.pnl)}`,
            sub: `≈ ${pnlINR >= 0 ? '+' : ''}₹${Math.round(Math.abs(pnlINR)).toLocaleString('en-IN')}`,
            color: stats.pnl >= 0 ? 'text-green-600' : 'text-red-600',
          },
          {
            label: 'XIRR',
            value: formatXIRR(stats.xirr),
            sub: `USD/INR: ₹${usdInrRate.toFixed(2)}`,
            color: stats.xirr !== null && stats.xirr >= 0 ? 'text-green-600' : 'text-red-600',
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>
      <Card title="🇺🇸 US Stocks Portfolio">
        <USStocksList />
      </Card>
    </div>
  );
}
