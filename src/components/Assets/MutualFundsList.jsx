import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import TransactionModal from '../Transactions/TransactionModal';
import SortableHeader from '../Common/SortableHeader';
import useSortState from '../../hooks/useSortState';

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

  const ic = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-600 text-xs font-medium mb-1';

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
      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
        💡 Find scheme codes at <span className="text-indigo-600">mfapi.in</span>. Example: 120503 = Mirae Asset Large Cap
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Fund'}</Button>
      </div>
    </form>
  );
}

export default function MutualFundsList() {
  const { data, getAssetStats, getPortfolioStats, getCategoryStats, getCategoryDailyChange, prices, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [txAsset, setTxAsset] = useState(null);
  const { sortCol, sortDir, handleSort } = useSortState();

  const mfs = data.mutualFunds || [];
  const totalPortfolioValue = getPortfolioStats().totalValue || 0;
  const todayPnl = getCategoryDailyChange('mutualFunds');
  const catStats = getCategoryStats('mutualFunds');
  const todayPct = catStats.totalValue > 0 ? (todayPnl / (catStats.totalValue - todayPnl)) * 100 : 0;

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

  // Pre-compute stats + weight for each fund so we can sort
  const mfRows = mfs.map(mf => {
    const stats = getAssetStats(mf, 'mutualFunds');
    const weight = totalPortfolioValue > 0 ? (stats.currentValue / totalPortfolioValue) * 100 : 0;
    return { mf, stats, weight };
  });

  // Sort
  const sortedRows = [...mfRows].sort((a, b) => {
    if (!sortCol || !sortDir) return 0;
    let valA, valB;
    switch (sortCol) {
      case 'name':    valA = a.mf.schemeName?.toLowerCase() ?? ''; valB = b.mf.schemeName?.toLowerCase() ?? ''; break;
      case 'units':   valA = a.stats.totalUnits; valB = b.stats.totalUnits; break;
      case 'avgNav':  valA = a.stats.avgBuyPrice; valB = b.stats.avgBuyPrice; break;
      case 'nav':     valA = a.stats.currentPrice ?? 0; valB = b.stats.currentPrice ?? 0; break;
      case 'invested': valA = a.stats.investedValue; valB = b.stats.investedValue; break;
      case 'currentValue': valA = a.stats.currentValue; valB = b.stats.currentValue; break;
      case 'weight':  valA = a.weight; valB = b.weight; break;
      case 'pnl':     valA = a.stats.pnl; valB = b.stats.pnl; break;
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
        <p className="text-gray-500 text-sm">{mfs.length} funds</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Fund</Button>
      </div>

      {mfs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🏦</div>
          <p className="font-medium text-gray-500 mb-1">No mutual funds added yet</p>
          <p className="text-sm">Add your first mutual fund to start tracking</p>
        </div>
      ) : (
        <div>
          {/* Section Today's P&L Summary */}
          <div className="flex items-center gap-6 mb-3 px-1">
            <div>
              <p className="text-gray-500 text-xs">Today's P&L</p>
              <p className={`text-sm font-semibold ${todayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}
                <span className="text-xs ml-1">({todayPnl >= 0 ? '+' : ''}{todayPct.toFixed(2)}%)</span>
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <SortableHeader label="Fund" colKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Units" colKey="units" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Avg NAV" colKey="avgNav" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Current NAV" colKey="nav" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Invested" colKey="invested" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Current Value" colKey="currentValue" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Weight" colKey="weight" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="P&L" colKey="pnl" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="XIRR" colKey="xirr" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left text-gray-500 text-xs font-medium py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ mf, stats, weight }) => {
                const priceInfo = prices[mf.schemeCode];
                return (
                  <tr key={mf.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 max-w-[200px]">
                      <p className="text-gray-900 font-medium text-xs leading-snug truncate">{mf.schemeName}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Code: {mf.schemeCode}</p>
                      {priceInfo?.date && <p className="text-gray-400 text-[10px]">NAV: {priceInfo.date}</p>}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{formatNumber(stats.totalUnits, 3)}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatCurrency(stats.avgBuyPrice)}</td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-900">{stats.currentPrice ? formatCurrency(stats.currentPrice) : '—'}</p>
                      {priceInfo?.changePercent != null && (
                        <p className={`text-xs ${priceInfo.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceInfo.changePercent >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
                        </p>
                      )}
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
                      <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(stats.pnlPercent)}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-sm font-medium ${stats.xirr === null ? 'text-gray-400' : stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatXIRR(stats.xirr)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setTxAsset(mf)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md">Txns</button>
                        <button onClick={() => setEditAsset(mf)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">✏️</button>
                        <button onClick={() => handleDelete(mf.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
