import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function UpcomingMaturities() {
  const { data, getAssetStats } = usePortfolio();
  const upcomingFDs = (data.fixedDeposits || [])
    .map((fd) => {
      const daysToMaturity = fd.maturityDate ? Math.ceil((new Date(fd.maturityDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
      return { fd, daysToMaturity };
    })
    .filter(({ daysToMaturity }) => daysToMaturity !== null && daysToMaturity > 0 && daysToMaturity < 90)
    .sort((a, b) => a.daysToMaturity - b.daysToMaturity);

  if (!upcomingFDs.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No maturities due in the next 90 days.</p>;
  }

  return (
    <div className="space-y-3">
      {upcomingFDs.slice(0, 5).map(({ fd, daysToMaturity }) => {
        const stats = getAssetStats(fd, 'fixedDeposits');
        return (
          <div key={fd.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fd.bankName}</p>
              <p className="text-xs text-amber-600 dark:text-amber-300 font-semibold">{daysToMaturity} days</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Matures on {formatDate(fd.maturityDate)}</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Estimated maturity value: {formatCurrency(stats.currentValue)}</p>
          </div>
        );
      })}
    </div>
  );
}
