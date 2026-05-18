import React, { useMemo } from 'react';
import Card from '../../components/Common/Card';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

function getFinancialYear(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = month >= 3 ? year : year - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export default function Dividends() {
  const { data, getAssetStats } = usePortfolio();

  const entries = useMemo(() => {
    const categories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'];
    return categories.flatMap((category) => (data[category] || []).flatMap((asset) =>
      (asset.transactions || [])
        .filter((tx) => tx.type === 'dividend')
        .map((tx) => ({
          id: tx.id,
          asset: asset.name || asset.symbol || asset.schemeName || 'Asset',
          date: tx.date,
          amount: Number(tx.amount || tx.price || 0),
          fy: getFinancialYear(tx.date),
          currentValue: getAssetStats(asset, category).currentValue || 0,
        }))
    )).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data, getAssetStats]);

  const byFY = useMemo(() => entries.reduce((acc, entry) => {
    acc[entry.fy] = acc[entry.fy] || { total: 0, entries: [] };
    acc[entry.fy].total += entry.amount;
    acc[entry.fy].entries.push(entry);
    return acc;
  }, {}), [entries]);

  const totalDividends = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      <Card title="Dividend Tracker" subtitle={`Total dividends received: ${formatCurrency(totalDividends)}`}>
        {Object.entries(byFY).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No dividend transactions recorded yet. Add a Dividend transaction from any asset's transaction modal.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(byFY).sort((a, b) => b[0].localeCompare(a[0])).map(([fy, info]) => (
              <div key={fy} className="rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fy}</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(info.total)}</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {info.entries.map((entry) => (
                    <div key={entry.id} className="px-3 py-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-900 dark:text-gray-100">{entry.asset}</p>
                        <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                      </div>
                      <p className="text-green-600 font-medium">{formatCurrency(entry.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
