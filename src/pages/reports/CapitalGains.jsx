import React, { useMemo } from 'react';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Equity LTCG exemption limit under current Indian tax rules (FY 2024-25 onward).
const LTCG_EXEMPTION_LIMIT = 125000;

function getFinancialYear(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = month >= 3 ? year : year - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export default function CapitalGains() {
  const { data } = usePortfolio();

  const rows = useMemo(() => {
    const categories = ['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver', 'others', 'realEstate'];
    return categories.flatMap((category) => (data[category] || []).flatMap((asset) => {
      const txs = (asset.transactions || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      const buys = txs.filter((tx) => tx.type === 'buy');
      const avgBuyPrice = buys.length ? buys.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) / Math.max(1, buys.reduce((sum, tx) => sum + Number(tx.quantity || 0), 0)) : 0;
      return txs.filter((tx) => tx.type === 'sell').map((sellTx) => {
        const sellDate = new Date(sellTx.date);
        const firstBuy = buys[0] ? new Date(buys[0].date) : sellDate;
        const holdingDays = Math.max(0, (sellDate - firstBuy) / (1000 * 60 * 60 * 24));
        const type = holdingDays < 365 ? 'stcg' : 'ltcg';
        const debtLike = ['fixedDeposits', 'debt', 'cash'].includes(category);
        const taxRate = type === 'stcg' ? (debtLike ? 0.3 : 0.2) : 0.125;
        const sellAmount = Number(sellTx.amount || 0);
        const cost = Number(sellTx.quantity || 0) * avgBuyPrice;
        const gain = sellAmount - cost;
        return {
          id: sellTx.id,
          asset: asset.name || asset.symbol || asset.schemeName || 'Asset',
          category,
          buyDate: buys[0]?.date,
          sellDate: sellTx.date,
          buyPrice: avgBuyPrice,
          sellPrice: Number(sellTx.price || 0),
          quantity: Number(sellTx.quantity || 0),
          gain,
          type,
          debtLike,
          taxRate,
          taxAmount: Math.max(0, gain * taxRate),
          fy: getFinancialYear(sellTx.date),
        };
      });
    }));
  }, [data]);

  const summary = useMemo(() => {
    const totalSTCG = rows.filter((r) => r.type === 'stcg').reduce((sum, r) => sum + r.gain, 0);
    const totalLTCG = rows.filter((r) => r.type === 'ltcg').reduce((sum, r) => sum + r.gain, 0);
    const stcgTax = rows.filter((r) => r.type === 'stcg').reduce((sum, r) => sum + r.taxAmount, 0);
    const ltcgGainTaxable = Math.max(0, totalLTCG - LTCG_EXEMPTION_LIMIT);
    const ltcgTax = rows.filter((r) => r.type === 'ltcg').reduce((sum, r) => sum + r.taxAmount, 0) * (ltcgGainTaxable > 0 ? (ltcgGainTaxable / Math.max(totalLTCG, 1)) : 0);
    return {
      totalSTCG,
      totalLTCG,
      stcgTax,
      ltcgTax,
      netTax: stcgTax + ltcgTax,
    };
  }, [rows]);

  const exportCSV = () => {
    const header = ['FY', 'Asset', 'Category', 'Type', 'Buy Date', 'Sell Date', 'Buy Price', 'Sell Price', 'Quantity', 'Gain', 'Tax Rate', 'Tax Amount'];
    const lines = rows.map((row) => [row.fy, row.asset, row.category, row.type.toUpperCase(), row.buyDate || '', row.sellDate, row.buyPrice, row.sellPrice, row.quantity, row.gain, `${(row.taxRate * 100).toFixed(0)}%`, row.taxAmount]);
    const csv = [header, ...lines].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `capital-gains-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card title="Capital Gains Report" action={<Button size="sm" onClick={exportCSV}>Export CSV</Button>}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Total STCG</p><p className="font-semibold">{formatCurrency(summary.totalSTCG)} <span className="text-xs text-red-600">Tax: {formatCurrency(summary.stcgTax)}</span></p></div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Total LTCG</p><p className="font-semibold">{formatCurrency(summary.totalLTCG)} <span className="text-xs text-red-600">Tax: {formatCurrency(summary.ltcgTax)}</span></p></div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Net tax liability</p><p className="font-semibold text-red-600">{formatCurrency(summary.netTax)}</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-2 text-xs text-gray-500">FY</th>
                <th className="text-left py-2 pr-2 text-xs text-gray-500">Asset</th>
                <th className="text-left py-2 pr-2 text-xs text-gray-500">Type</th>
                <th className="text-left py-2 pr-2 text-xs text-gray-500">Dates</th>
                <th className="text-right py-2 pr-2 text-xs text-gray-500">Gain</th>
                <th className="text-right py-2 pr-2 text-xs text-gray-500">Tax</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-2">{row.fy}</td>
                  <td className="py-2 pr-2">{row.asset}</td>
                  <td className="py-2 pr-2 uppercase">{row.type}</td>
                  <td className="py-2 pr-2 text-xs text-gray-500">{formatDate(row.buyDate)} → {formatDate(row.sellDate)}</td>
                  <td className={`py-2 pr-2 text-right ${row.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(row.gain)}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(row.taxAmount)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No realized gains yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
