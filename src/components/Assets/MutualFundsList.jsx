import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent, formatDate } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import TransactionModal from '../Transactions/TransactionModal';

function MFForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({ schemeCode: '', schemeName: '', ...initial });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.schemeCode.trim()) return setErr('Scheme code is required');
    if (!form.schemeName.trim()) return setErr('Scheme name is required');
    setErr('');
    onSubmit(form);
  };

  const ic = 'w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-400 text-xs font-medium mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lc}>Scheme Code (from MFAPI)</label>
        <input className={ic} value={form.schemeCode} onChange={e => setForm(f => ({ ...f, schemeCode: e.target.value.trim() }))} placeholder="e.g. 120503" />
      </div>
      <div>
        <label className={lc}>Scheme Name</label>
        <input className={ic} value={form.schemeName} onChange={e => setForm(f => ({ ...f, schemeName: e.target.value }))} placeholder="e.g. Mirae Asset Large Cap Fund" />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <div className="text-xs text-gray-500 bg-gray-900 rounded-lg p-3">
        💡 Find scheme codes at <span className="text-indigo-400">mfapi.in</span>. Example: 120503 = Mirae Asset Large Cap
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Fund'}</Button>
      </div>
    </form>
  );
}

export default function MutualFundsList() {
  const { data, getAssetStats, prices, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [txAsset, setTxAsset] = useState(null);

  const mfs = data.mutualFunds || [];

  const handleAdd = (form) => {
    addAsset('mutualFunds', { ...form, category: 'mutualFunds', transactions: [] });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('mutualFunds', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this fund and all its transactions?')) {
      deleteAsset('mutualFunds', id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-400 text-sm">{mfs.length} funds</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Fund</Button>
      </div>

      {mfs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🏦</div>
          <p className="font-medium text-gray-400 mb-1">No mutual funds added yet</p>
          <p className="text-sm">Add your first mutual fund to start tracking</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {['Fund', 'Units', 'Avg NAV', 'Current NAV', 'Invested', 'Current Value', 'P&L', 'XIRR', ''].map(h => (
                  <th key={h} className="text-left text-gray-400 text-xs font-medium py-3 pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mfs.map(mf => {
                const stats = getAssetStats(mf, 'mutualFunds');
                const priceInfo = prices[mf.schemeCode];
                return (
                  <tr key={mf.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="py-3 pr-4 max-w-[200px]">
                      <p className="text-white font-medium text-xs leading-snug truncate">{mf.schemeName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Code: {mf.schemeCode}</p>
                      {priceInfo?.date && <p className="text-gray-600 text-[10px]">NAV: {priceInfo.date}</p>}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{formatNumber(stats.totalUnits, 3)}</td>
                    <td className="py-3 pr-4 text-gray-300">{formatCurrency(stats.avgBuyPrice)}</td>
                    <td className="py-3 pr-4">
                      <p className="text-white">{stats.currentPrice ? formatCurrency(stats.currentPrice) : '—'}</p>
                      {priceInfo?.changePercent != null && (
                        <p className={`text-xs ${priceInfo.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {priceInfo.changePercent >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{formatCurrency(stats.investedValue)}</td>
                    <td className="py-3 pr-4 text-white font-medium">{formatCurrency(stats.currentValue)}</td>
                    <td className="py-3 pr-4">
                      <p className={stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                      </p>
                      <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(stats.pnlPercent)}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-sm font-medium ${stats.xirr === null ? 'text-gray-500' : stats.xirr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatXIRR(stats.xirr)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setTxAsset(mf)} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md">Txns</button>
                        <button onClick={() => setEditAsset(mf)} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded-lg">✏️</button>
                        <button onClick={() => handleDelete(mf.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Mutual Fund">
        <MFForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Mutual Fund">
        <MFForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
      <TransactionModal isOpen={!!txAsset} onClose={() => setTxAsset(null)} asset={txAsset} category="mutualFunds" />
    </div>
  );
}
