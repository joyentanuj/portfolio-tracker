import React, { useMemo } from 'react';
import { ArrowRightLeft, Clock } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
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

export default function RecentTransactions() {
  const { data } = usePortfolio();

  const transactions = useMemo(() => {
    const txList = [];
    const txCategories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];

    for (const cat of txCategories) {
      for (const asset of (data[cat] || [])) {
        for (const tx of (asset.transactions || [])) {
          txList.push({
            date: new Date(tx.date),
            dateStr: tx.date,
            name: asset.name || asset.symbol || asset.schemeName || 'Unknown',
            category: cat,
            type: tx.type,
            amount: Number(tx.amount),
            quantity: Number(tx.quantity),
            path: CATEGORY_PATHS[cat],
            color: CATEGORY_COLORS[cat],
          });
        }
      }
    }

    return txList
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  }, [data]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm gap-2">
        <ArrowRightLeft className="w-8 h-8" />
        <p>No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx, i) => (
        <Link
          key={i}
          to={tx.path}
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          aria-label={`${tx.type} ${tx.name} on ${formatDate(tx.dateStr)}`}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs"
            style={{ background: tx.color + '22' }}
          >
            {CATEGORY_ICONS[tx.category]}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-gray-100 text-xs font-medium truncate">{tx.name}</p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatDate(tx.dateStr)}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-0.5 ${
                tx.type === 'buy'
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
              }`}
            >
              {tx.type}
            </span>
            <p className="text-gray-700 dark:text-gray-300 text-xs font-semibold">{formatCurrency(tx.amount)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
