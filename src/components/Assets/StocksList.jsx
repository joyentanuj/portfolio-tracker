import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import TransactionModal from '../Transactions/TransactionModal';

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
  const { data, getAssetStats, prices, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [txAsset, setTxAsset] = useState(null);

  const stocks = data.stocks || [];

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
                {['Stock', 'Holdings', 'Avg Price', 'LTP', 'Invested', 'Current Value', 'P&L', 'XIRR', ''].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs font-medium py-3 pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => {
                const stats = getAssetStats(stock, 'stocks');
                const priceInfo = prices[stock.symbol];
                return (
                  <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-gray-900 font-semibold">{stock.symbol}</p>
                        <p className="text-gray-400 text-xs">{stock.name}</p>
                      </div>
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
                    <td className="py-3 pr-4">
                      <p className={stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                      </p>
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
