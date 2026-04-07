import React, { useState } from 'react';
import { Pencil, Trash2, Info, AlignJustify, List, Plus } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import ConfirmDialog from '../Common/ConfirmDialog';
import TransactionModal from '../Transactions/TransactionModal';
import SortableHeader from '../Common/SortableHeader';
import useSortState from '../../hooks/useSortState';
import useTableDensity from '../../hooks/useTableDensity';
import { usePriceFlash } from '../../hooks/usePriceFlash';
import { SkeletonTable } from '../Common/Skeleton';
import EmptyState from '../Common/EmptyState';

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

  const ic = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500 dark:placeholder-gray-400';
  const lc = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';

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
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
        <Info className="w-3.5 h-3.5 inline-block mr-1 shrink-0" />
        For NSE stocks, use format: <code className="text-indigo-600">SYMBOL.NS</code> (e.g. RELIANCE.NS). For BSE: <code className="text-indigo-600">SYMBOL.BO</code>. For US: <code className="text-indigo-600">AAPL</code>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Stock'}</Button>
      </div>
    </form>
  );
}

function StockRow({ stock, stats, weight, priceInfo, totalPortfolioValue, onTxn, onEdit, onDelete, dense }) {
  const flash = usePriceFlash(stats.currentPrice);
  const py = dense ? 'py-1.5' : 'py-3';
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
      <td className={`${py} pr-4`}>
        <p className="text-gray-900 dark:text-gray-100 font-medium text-xs leading-snug">{stock.name}</p>
      </td>
      <td className={`${py} pr-4`}>
        <p className="text-gray-900 dark:text-gray-100 font-semibold">{stock.symbol}</p>
      </td>
      <td className={`${py} pr-4 text-gray-700 dark:text-gray-300`}>{formatNumber(stats.totalUnits, 2)}</td>
      <td className={`${py} pr-4 text-gray-700 dark:text-gray-300`}>{formatCurrency(stats.avgBuyPrice)}</td>
      <td className={`${py} pr-4 rounded transition-colors ${flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : ''}`}>
        <div>
          <p className="text-gray-900 dark:text-gray-100">{stats.currentPrice ? formatCurrency(stats.currentPrice) : '—'}</p>
          {priceInfo?.changePercent != null && (
            <p className={`text-xs ${priceInfo.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceInfo.changePercent >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
            </p>
          )}
        </div>
      </td>
      <td className={`${py} pr-4 text-gray-700 dark:text-gray-300`}>{formatCurrency(stats.investedValue)}</td>
      <td className={`${py} pr-4 text-gray-900 dark:text-gray-100 font-medium`}>{formatCurrency(stats.currentValue)}</td>
      <td className={`${py} pr-4 text-gray-600 dark:text-gray-400`}>
        {totalPortfolioValue > 0 ? `${weight.toFixed(2)}%` : '—'}
      </td>
      <td className={`${py} pr-4`}>
        <p className={stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
        </p>
      </td>
      <td className={`${py} pr-4`}>
        <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercent(stats.pnlPercent)}
        </p>
      </td>
      <td className={`${py} pr-4`}>
        <span className={`text-sm font-medium ${stats.xirr === null ? 'text-gray-400 dark:text-gray-500' : stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatXIRR(stats.xirr)}
        </span>
      </td>
      <td className={py}>
        <div className="flex items-center gap-1">
          <button onClick={onTxn} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md transition-colors">Txns</button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function StocksList() {
  const { data, getAssetStats, getPortfolioStats, getCategoryStats, getCategoryDailyChange, prices, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [txAsset, setTxAsset] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { sortCol, sortDir, handleSort } = useSortState();
  const { dense, toggle: toggleDensity } = useTableDensity();

  const stocks = data.stocks || [];
  const totalPortfolioValue = getPortfolioStats().totalValue || 0;
  const todayPnl = getCategoryDailyChange('stocks');
  const catStats = getCategoryStats('stocks');
  const todayPct = catStats.totalValue > 0 ? (todayPnl / (catStats.totalValue - todayPnl)) * 100 : 0;

  const handleAdd = (form) => {
    addAsset('stocks', { ...form, category: 'stocks', transactions: [] });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('stocks', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => setConfirmDelete(id);
  const handleConfirmDelete = () => {
    deleteAsset('stocks', confirmDelete);
    setConfirmDelete(null);
  };

  // Pre-compute stats + weight for each stock so we can sort
  const stockRows = stocks.map(stock => {
    const stats = getAssetStats(stock, 'stocks');
    const weight = totalPortfolioValue > 0 ? (stats.currentValue / totalPortfolioValue) * 100 : 0;
    return { stock, stats, weight };
  });

  // Totals for footer
  const totalInvested = stockRows.reduce((s, r) => s + r.stats.investedValue, 0);
  const totalCurrentValue = stockRows.reduce((s, r) => s + r.stats.currentValue, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? totalPnl / totalInvested : 0;

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
        <p className="text-gray-500 dark:text-gray-400 text-sm">{stocks.length} stocks</p>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDensity}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={dense ? 'Comfortable view' : 'Compact view'}
          >
            {dense ? <AlignJustify className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          <Button onClick={() => setAddModal(true)} icon={<Plus className="w-3.5 h-3.5" />} size="sm">Add Stock</Button>
        </div>
      </div>

      {stocks.length === 0 ? (
        <EmptyState
          icon="📈"
          title="No stocks yet"
          description="Start tracking your Indian stock holdings by adding your first position."
          actionLabel="Add Stock"
          onAction={() => setAddModal(true)}
        />
      ) : Object.keys(prices).length === 0 ? (
        <SkeletonTable rows={stocks.length || 5} cols={12} />
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
                  <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-medium py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ stock, stats, weight }) => {
                const priceInfo = prices[stock.symbol];
                return (
                  <StockRow
                    key={stock.id}
                    stock={stock}
                    stats={stats}
                    weight={weight}
                    priceInfo={priceInfo}
                    totalPortfolioValue={totalPortfolioValue}
                    onTxn={() => setTxAsset(stock)}
                    onEdit={() => setEditAsset(stock)}
                    onDelete={() => handleDelete(stock.id)}
                    dense={dense}
                  />
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={2} className="py-3 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wide">
                  Total ({stocks.length} stocks)
                </td>
                <td className="py-3 pr-4" />
                <td className="py-3 pr-4" />
                <td className="py-3 pr-4" />
                <td className="py-3 pr-4 text-gray-900 dark:text-gray-100 text-sm font-bold">{formatCurrency(totalInvested)}</td>
                <td className="py-3 pr-4 text-gray-900 dark:text-gray-100 text-sm font-bold">{formatCurrency(totalCurrentValue)}</td>
                <td className="py-3 pr-4" />
                <td className={`py-3 pr-4 text-sm font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                </td>
                <td className={`py-3 pr-4 text-sm font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(totalPnlPercent)}
                </td>
                <td className="py-3 pr-4" />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Stock">
        <StockForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Stock">
        <StockForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
      <TransactionModal isOpen={!!txAsset} onClose={() => setTxAsset(null)} asset={txAsset} category="stocks" />
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Stock?"
        description="This will permanently delete this stock and all its transactions."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
