import React, { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';

function createAssetFromWatchlistItem(item) {
  const category = item.type === 'mutualFund' ? 'mutualFunds' : 'stocks';
  const unitPrice = item.currentPrice || item.targetPrice || 0;
  const transaction = {
    type: 'buy',
    date: new Date().toISOString().split('T')[0],
    quantity: 1,
    price: unitPrice,
    amount: unitPrice,
    notes: 'From watchlist',
  };

  if (item.type === 'mutualFund') {
    return {
      category,
      asset: {
        schemeCode: item.symbol,
        schemeName: item.name,
        category,
        transactions: [transaction],
      },
    };
  }

  return {
    category,
    asset: {
      symbol: item.symbol,
      name: item.name,
      exchange: 'NSE',
      category,
      transactions: [transaction],
    },
  };
}

function WatchlistForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ type: 'stock', symbol: '', name: '', targetPrice: '', notes: '' });
  const inputClass = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100';
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, targetPrice: Number(form.targetPrice || 0) });
      }}
      className="space-y-3"
    >
      <select className={inputClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
        <option value="stock">Stock</option>
        <option value="mutualFund">Mutual Fund</option>
      </select>
      <input className={inputClass} value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} placeholder="Symbol / Scheme code" />
      <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
      <input className={inputClass} type="number" value={form.targetPrice} onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))} placeholder="Target price" />
      <input className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">Add</Button>
      </div>
    </form>
  );
}

export default function WatchlistTable() {
  const { data, prices, addWatchlistItem, updateWatchlistItem, deleteWatchlistItem, addAsset } = usePortfolio();
  const [addOpen, setAddOpen] = useState(false);
  const [sortBy, setSortBy] = useState('targetDiff');

  const items = useMemo(() => {
    const list = (data.watchlist || []).map((item) => {
      const p = prices[item.symbol];
      const currentPrice = Number(p?.price ?? p?.nav ?? item.currentPrice ?? 0);
      const targetPrice = Number(item.targetPrice || 0);
      const diffPct = targetPrice > 0 ? (currentPrice - targetPrice) / targetPrice : 0;
      const targetHit = targetPrice > 0 && currentPrice <= targetPrice;
      return { ...item, currentPrice, targetPrice, diffPct, targetHit };
    });
    return list.sort((a, b) => {
      if (sortBy === 'alpha') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'date') return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
      return a.diffPct - b.diffPct;
    });
  }, [data.watchlist, prices, sortBy]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <option value="targetDiff">Sort by % from target</option>
            <option value="alpha">Sort alphabetically</option>
            <option value="date">Sort by date added</option>
          </select>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>Add to Watchlist</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-3 text-xs text-gray-500">Asset</th>
              <th className="text-right py-2 pr-3 text-xs text-gray-500">Current</th>
              <th className="text-right py-2 pr-3 text-xs text-gray-500">Target</th>
              <th className="text-right py-2 pr-3 text-xs text-gray-500">% from target</th>
              <th className="text-left py-2 pr-3 text-xs text-gray-500">Notes</th>
              <th className="text-right py-2 text-xs text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-3">
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.symbol}
                    {item.targetHit && <Bell className="inline-block ml-1 w-3 h-3 text-amber-500" aria-label="Target hit" title="Target hit" />}
                  </p>
                </td>
                <td className="py-2 pr-3 text-right">{formatCurrency(item.currentPrice)}</td>
                <td className="py-2 pr-3 text-right">
                  <input
                    type="number"
                    value={item.targetPrice}
                    onChange={(e) => updateWatchlistItem(item.id, { targetPrice: Number(e.target.value || 0) })}
                    className="w-24 px-2 py-1 text-xs border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-right"
                  />
                </td>
                <td className={`py-2 pr-3 text-right ${item.diffPct <= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(item.diffPct)}</td>
                <td className="py-2 pr-3">
                  <input
                    value={item.notes || ''}
                    onChange={(e) => updateWatchlistItem(item.id, { notes: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => {
                        const { category, asset } = createAssetFromWatchlistItem(item);
                        addAsset(category, asset);
                      }}
                      className="px-2 py-1 text-xs rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    >
                      Buy
                    </button>
                    <button onClick={() => deleteWatchlistItem(item.id)} className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">No watchlist items yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add to Watchlist">
        <WatchlistForm onSubmit={(item) => { addWatchlistItem(item); setAddOpen(false); }} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
