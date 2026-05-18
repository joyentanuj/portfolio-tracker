import React, { useMemo, useState } from 'react';
import { differenceInMonths } from 'date-fns';
import Card from '../../components/Common/Card';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/formatters';

// Indicative rates for tax planning in current regime (update if laws change).
const TAX_RATES = { STCG: 0.3, LTCG: 0.2 };

export default function TaxLossHarvesting() {
  const { data, getAssetStats } = usePortfolio();
  const [holdingFilter, setHoldingFilter] = useState('all');
  const [selected, setSelected] = useState([]);

  const rows = useMemo(() => {
    const categories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver', 'realEstate', 'others'];
    return categories.flatMap((category) => (data[category] || []).map((asset) => {
      const stats = getAssetStats(asset, category);
      if (stats.pnl >= 0) return null;
      const txDates = (asset.transactions || []).filter((tx) => tx.type === 'buy').map((tx) => new Date(tx.date).getTime()).filter(Boolean);
      const firstBuy = txDates.length ? Math.min(...txDates) : Date.now();
      const holdingMonths = Math.max(1, differenceInMonths(new Date(), new Date(firstBuy)));
      const type = holdingMonths < 12 ? 'STCG' : 'LTCG';
      const loss = Math.abs(stats.pnl);
      const taxSaving = loss * TAX_RATES[type];
      return {
        id: `${category}-${asset.id}`,
        name: asset.name || asset.symbol || asset.schemeName || 'Asset',
        category,
        invested: stats.investedValue,
        currentValue: stats.currentValue,
        loss,
        holdingMonths,
        type,
        taxSaving,
      };
    })).filter(Boolean).filter((row) => holdingFilter === 'all' || row.type === holdingFilter);
  }, [data, getAssetStats, holdingFilter]);

  const totalLoss = rows.reduce((sum, row) => sum + row.loss, 0);
  const potentialTaxSaving = rows.reduce((sum, row) => sum + row.taxSaving, 0);
  const selectedSavings = rows.filter((row) => selected.includes(row.id)).reduce((sum, row) => sum + row.taxSaving, 0);

  return (
    <div className="space-y-6">
      <Card title="Tax Loss Harvesting Report">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Total unrealized losses</p><p className="font-semibold text-red-600">{formatCurrency(totalLoss)}</p></div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Potential tax savings</p><p className="font-semibold text-green-600">{formatCurrency(potentialTaxSaving)}</p></div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">What-if selected savings</p><p className="font-semibold text-indigo-600">{formatCurrency(selectedSavings)}</p></div>
        </div>
        <div className="mb-3">
          <select value={holdingFilter} onChange={(e) => setHoldingFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <option value="all">All</option>
            <option value="STCG">STCG (&lt; 1 year)</option>
            <option value="LTCG">LTCG (&gt; 1 year)</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-3 text-xs text-gray-500"></th>
                <th className="text-left py-2 pr-3 text-xs text-gray-500">Asset</th>
                <th className="text-right py-2 pr-3 text-xs text-gray-500">Loss</th>
                <th className="text-right py-2 pr-3 text-xs text-gray-500">Holding</th>
                <th className="text-right py-2 pr-3 text-xs text-gray-500">Type</th>
                <th className="text-right py-2 pr-3 text-xs text-gray-500">Tax saving</th>
                <th className="text-left py-2 text-xs text-gray-500">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id))} /></td>
                  <td className="py-2 pr-3">{row.name}</td>
                  <td className="py-2 pr-3 text-right text-red-600">{formatCurrency(row.loss)}</td>
                  <td className="py-2 pr-3 text-right">{row.holdingMonths}m</td>
                  <td className="py-2 pr-3 text-right">{row.type}</td>
                  <td className="py-2 pr-3 text-right text-green-600">{formatCurrency(row.taxSaving)}</td>
                  <td className="py-2 text-xs text-gray-500">{row.type === 'STCG' ? 'Consider offsetting STCG this FY' : 'Evaluate LTCG offset before year-end'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">No unrealized losses found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
