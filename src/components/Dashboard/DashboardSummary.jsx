import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatCurrencyCompact, formatXIRR, formatPercent } from '../../utils/formatters';

function StatCard({ label, value, sub, positive, neutral = false, large = false }) {
  const color = neutral ? 'text-white' : positive ? 'text-green-400' : 'text-red-400';
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-bold ${large ? 'text-2xl' : 'text-xl'} ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardSummary() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();
  const { totalValue, totalInvested, pnl, pnlPercent, xirr } = stats;

  const pnlPositive = pnl >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Portfolio Value"
        value={formatCurrencyCompact(totalValue)}
        sub={formatCurrency(totalValue)}
        positive
        neutral
        large
      />
      <StatCard
        label="Total Invested"
        value={formatCurrencyCompact(totalInvested)}
        sub={formatCurrency(totalInvested)}
        neutral
      />
      <StatCard
        label="Total P&L"
        value={`${pnlPositive ? '+' : ''}${formatCurrencyCompact(pnl)}`}
        sub={`${pnlPositive ? '+' : ''}${(pnlPercent * 100).toFixed(2)}% returns`}
        positive={pnlPositive}
      />
      <StatCard
        label="Overall XIRR"
        value={formatXIRR(xirr)}
        sub="Annualised return"
        positive={xirr !== null && xirr >= 0}
        neutral={xirr === null}
      />
    </div>
  );
}
