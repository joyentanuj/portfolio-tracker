import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import TransactionModal from '../Transactions/TransactionModal';
import SortableHeader from '../Common/SortableHeader';
import useSortState from '../../hooks/useSortState';

function StockForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({
    symbol: '',
    name: '',
    exchange: 'NSE',
    ...initial,
  });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.symbol.trim()) return setErr('Symbol is required');
    if (!form.name.trim()) return setErr('Name is required');
    setErr('');
    onSubmit({ ...form, symbol: form.symbol.toUpperCase().trim() });
  };

  const ic = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-600 text-xs font-medium mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Exchange</label>
          <select className={ic} value={form.exchange} onChange={e => setForm(f => ({ ...f, exchange: e.target.value }))}>
            <option value="NSE">NSE (India)</option>
            <option value="BSE">BSE (India)</option>
            <option value="US">US Markets</option>
          </select>
        </div>
        <div>
          <label className={lc}>Symbol</label>
          <input
            className={ic}
            value={form.symbol}
            onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
            placeholder={form.exchange === 'US' ? 'AAPL' : 'RELIANCE.NS'}
          />
        </div>
      </div>
      <div>
        <label className={lc}>Stock Name</label>
        <input className={ic} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Reliance Industries" />
      </div>
      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
        💡 For NSE stocks, use format: <code className="text-indigo-600">SYMBOL.NS</code> (e.g. RELIANCE.NS). For BSE: <code className="text-indigo-600">SYMBOL.BO</code>. For US: <code className="text-indigo-600">AAPL</code>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Stock'}</Button>
      </div>
    </form>
  );
}

export default function StocksList() {
  const { data, getAssetStats, getPortfolioStats, prices, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [txAsset, setTxAsset] = useState(null);
  const { sortCol, sortDir, handleSort } = useSortState();

  const stocks = data.stocks || [];
  const totalPortfolioValue = getPortfolioStats().totalValue || 0;

  const handleAdd = (form) => {
    addAsset('stocks', { ...form, category: 'stocks', transactions: [] });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('stocks', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this stock and all its transactions?')) {
      deleteAsset('stocks', id);
    }
  };

  // Pre-compute stats + weight for each stock so we can sort
  const stockRows = stocks.map(stock => {
    const stats = getAssetStats(stock, 'stocks');
    const weight = totalPortfolioValue > 0 ? (stats.currentValue / totalPortfolioValue) * 100 : 0;
    return { stock, stats, weight };
  });

  // Sort
  const sortedRows = [...stockRows].sort((a, b) => {
    if (!sortCol || !sortDir) return 0;
    let valA, valB;
    switch (sortCol) {
      case 'name':    valA = a.stock.name?.toLowerCase() ?? ''; valB = b.stock.name?.toLowerCase() ?? ''; break;
      case 'symbol':  valA = a.stock.symbol?.toLowerCase() ?? ''; valB = b.stock.symbol?.toLowerCase() ?? ''; break;
      case 'units':   valA = a.stats.totalUnits; valB = b.stats.totalUnits; break;
      case 'avgCost': valA = a.stats.avgBuyPrice; valB = b.stats.avgBuyPrice; break;
      case 'ltp':     valA = a.stats.currentPrice ?? 0; valB = b.stats.currentPrice ?? 0; break;
      case 'invested': valA = a.stats.investedValue; valB = b.stats.investedValue; break;
      case 'currentValue': valA = a.stats.currentValue; valB = b.stats.currentValue; break;
      case 'weight':  valA = a.weight; valB = b.weight; break;
      case 'pnl':     valA = a.stats.pnl; valB = b.stats.pnl; break;
      case 'pnlPct':  valA = a.stats.pnlPercent; valB = b.stats.pnlPercent; break;
      case 'xirr':    valA = a.stats.xirr ?? -Infinity; valB = b.stats.xirr ?? -Infinity; break;
      default: return 0;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 text-sm">{stocks.length} stocks</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Stock</Button>
      </div>

      {stocks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📈</div>
          <p className="font-medium text-gray-500 mb-1">No stocks added yet</p>
          <p className="text-sm">Add your first stock to start tracking</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <SortableHeader label="Stock" colKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Symbol" colKey="symbol" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Holdings" colKey="units" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Avg Price" colKey="avgCost" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="LTP" colKey="ltp" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Invested" colKey="invested" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Current Value" colKey="currentValue" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Weight" colKey="weight" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="P&L" colKey="pnl" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="P&L %" colKey="pnlPct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="XIRR" colKey="xirr" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left text-gray-500 text-xs font-medium py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ stock, stats, weight }) => {
                const priceInfo = prices[stock.symbol];
                return (
                  <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="text-gray-900 font-medium text-xs leading-snug">{stock.name}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-900 font-semibold">{stock.symbol}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{formatNumber(stats.totalUnits, 2)}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatCurrency(stats.avgBuyPrice)}</td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-gray-900">{stats.currentPrice ? formatCurrency(stats.currentPrice) : '—'}</p>
                        {priceInfo?.changePercent != null && (
                          <p className={`text-xs ${priceInfo.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {priceInfo.changePercent >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{formatCurrency(stats.investedValue)}</td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">{formatCurrency(stats.currentValue)}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {totalPortfolioValue > 0 ? `${weight.toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <p className={stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercent(stats.pnlPercent)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-sm font-medium ${stats.xirr === null ? 'text-gray-400' : stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatXIRR(stats.xirr)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setTxAsset(stock)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors">Txns</button>
                        <button onClick={() => setEditAsset(stock)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">✏️</button>
                        <button onClick={() => handleDelete(stock.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Stock">
        <StockForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Stock">
        <StockForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
      <TransactionModal isOpen={!!txAsset} onClose={() => setTxAsset(null)} asset={txAsset} category="stocks" />
    </div>
  );
}
