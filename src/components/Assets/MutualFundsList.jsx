import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import TransactionModal from '../Transactions/TransactionModal';
import SortableHeader from '../Common/SortableHeader';
import useSortState from '../../hooks/useSortState';
import { usePriceFlash } from '../../hooks/usePriceFlash';
import { SkeletonTable } from '../Common/Skeleton';
import EmptyState from '../Common/EmptyState';

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

  const ic = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500 dark:placeholder-gray-400';
  const lc = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';

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
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
        💡 Find scheme codes at <span className="text-indigo-600">mfapi.in</span>. Example: 120503 = Mirae Asset Large Cap
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Fund'}</Button>
      </div>
    </form>
  );
}

function MFRow({ mf, stats, weight, priceInfo, totalPortfolioValue, onTxn, onEdit, onDelete }) {
  const flash = usePriceFlash(stats.currentPrice);
  return (
    <tr
      className={`border-b transition-colors
        ${stats.pnl > 0
          ? 'border-gray-100 dark:border-gray-700 hover:bg-green-50/60 dark:hover:bg-green-900/10 bg-green-50/20 dark:bg-green-900/5'
          : stats.pnl < 0
          ? 'border-gray-100 dark:border-gray-700 hover:bg-red-50/60 dark:hover:bg-red-900/10 bg-red-50/20 dark:bg-red-900/5'
          : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }
      `}
    >
      <td className="py-3 pr-4 max-w-[200px]">
        <p className="text-gray-900 dark:text-gray-100 font-medium text-xs leading-snug truncate">{mf.schemeName}</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Code: {mf.schemeCode}</p>
        {priceInfo?.date && <p className="text-gray-400 dark:text-gray-500 text-[10px]">NAV: {priceInfo.date}</p>}
      </td>
      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{formatNumber(stats.totalUnits, 3)}</td>
      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{formatCurrency(stats.avgBuyPrice)}</td>
      <td className={`py-3 pr-4 rounded transition-colors ${flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : ''}`}>
        <p className="text-gray-900 dark:text-gray-100">{stats.currentPrice ? formatCurrency(stats.currentPrice) : '—'}</p>
        {priceInfo?.changePercent != null && (
          <p className={`text-xs ${priceInfo.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceInfo.changePercent >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
          </p>
        )}
      </td>
      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{formatCurrency(stats.investedValue)}</td>
      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(stats.currentValue)}</td>
      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
        {totalPortfolioValue > 0 ? `${weight.toFixed(2)}%` : '—'}
      </td>
      <td className="py-3 pr-4">
        <p className={stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
        </p>
        <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(stats.pnlPercent)}</p>
      </td>
      <td className="py-3 pr-4">
        <span className={`text-sm font-medium ${stats.xirr === null ? 'text-gray-400 dark:text-gray-500' : stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatXIRR(stats.xirr)}
        </span>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-1">
          <button onClick={onTxn} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md">Txns</button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">✏️</button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">🗑️</button>
        </div>
      </td>
    </tr>
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

  // Totals for footer
  const totalInvested = mfRows.reduce((s, r) => s + r.stats.investedValue, 0);
  const totalCurrentValue = mfRows.reduce((s, r) => s + r.stats.currentValue, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? totalPnl / totalInvested : 0;

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
        <p className="text-gray-500 dark:text-gray-400 text-sm">{mfs.length} funds</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Fund</Button>
      </div>

      {mfs.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No mutual funds yet"
          description="Add your mutual fund holdings using MFAPI scheme codes to track NAV and returns."
          actionLabel="Add Fund"
          onAction={() => setAddModal(true)}
        />
      ) : Object.keys(prices).length === 0 ? (
        <SkeletonTable rows={mfs.length || 5} cols={10} />
      ) : (
        <div>
          {/* Section Today's P&L Summary */}
          <div className="flex items-center gap-6 mb-3 px-1">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Today's P&L</p>
              <p className={`text-sm font-semibold ${todayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}
                <span className="text-xs ml-1">({todayPnl >= 0 ? '+' : ''}{todayPct.toFixed(2)}%)</span>
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <SortableHeader label="Fund" colKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Units" colKey="units" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Avg NAV" colKey="avgNav" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Current NAV" colKey="nav" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Invested" colKey="invested" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Current Value" colKey="currentValue" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Weight" colKey="weight" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="P&L" colKey="pnl" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="XIRR" colKey="xirr" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-medium py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ mf, stats, weight }) => {
                const priceInfo = prices[mf.schemeCode];
                return (
                  <MFRow
                    key={mf.id}
                    mf={mf}
                    stats={stats}
                    weight={weight}
                    priceInfo={priceInfo}
                    totalPortfolioValue={totalPortfolioValue}
                    onTxn={() => setTxAsset(mf)}
                    onEdit={() => setEditAsset(mf)}
                    onDelete={() => handleDelete(mf.id)}
                  />
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={1} className="py-3 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wide">
                  Total ({mfs.length} funds)
                </td>
                <td className="py-3 pr-4" />
                <td className="py-3 pr-4" />
                <td className="py-3 pr-4" />
                <td className="py-3 pr-4 text-gray-900 dark:text-gray-100 text-sm font-bold">{formatCurrency(totalInvested)}</td>
                <td className="py-3 pr-4 text-gray-900 dark:text-gray-100 text-sm font-bold">{formatCurrency(totalCurrentValue)}</td>
                <td className="py-3 pr-4" />
                <td className={`py-3 pr-4 text-sm font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                  <p className={`text-xs font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(totalPnlPercent)}</p>
                </td>
                <td className="py-3 pr-4" />
                <td />
              </tr>
            </tfoot>
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
