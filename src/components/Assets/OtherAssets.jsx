import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';

function OtherForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({
    name: '',
    type: '',
    purchasePrice: '',
    currentValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    ...initial,
    purchasePrice: initial?.purchasePrice ?? '',
    currentValue: initial?.currentValue ?? '',
  });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Name is required');
    if (!form.purchasePrice || isNaN(form.purchasePrice) || Number(form.purchasePrice) < 0) return setErr('Enter valid purchase price');
    setErr('');
    onSubmit({
      ...form,
      purchasePrice: Number(form.purchasePrice),
      currentValue: form.currentValue ? Number(form.currentValue) : Number(form.purchasePrice),
    });
  };

  const ic = 'w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-400 text-xs font-medium mb-1';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Asset Name</label>
          <input className={ic} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Vintage Watch" />
        </div>
        <div>
          <label className={lc}>Asset Type</label>
          <input className={ic} value={form.type} onChange={e => set('type', e.target.value)} placeholder="e.g. Collectibles" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Purchase Price (₹)</label>
          <input type="number" className={ic} value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="100000" min="0" />
        </div>
        <div>
          <label className={lc}>Current Value (₹)</label>
          <input type="number" className={ic} value={form.currentValue} onChange={e => set('currentValue', e.target.value)} placeholder="150000" min="0" />
        </div>
      </div>
      <div>
        <label className={lc}>Purchase Date</label>
        <input type="date" className={ic} value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
      </div>
      <div>
        <label className={lc}>Notes</label>
        <input className={ic} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Description, location, etc." />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Asset'}</Button>
      </div>
    </form>
  );
}

export default function OtherAssets() {
  const { data, getAssetStats, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const others = data.others || [];

  const handleAdd = (form) => {
    addAsset('others', { ...form, category: 'others' });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('others', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this asset?')) deleteAsset('others', id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-400 text-sm">{others.length} assets</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Asset</Button>
      </div>

      {others.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-medium text-gray-400 mb-1">No other assets</p>
          <p className="text-sm">Track collectibles, vehicles, jewellery, and more</p>
        </div>
      ) : (
        <div className="space-y-3">
          {others.map(asset => {
            const stats = getAssetStats(asset, 'others');
            return (
              <div key={asset.id} className="flex items-center justify-between bg-gray-900 rounded-xl border border-gray-700 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{asset.name}</p>
                    {asset.type && (
                      <span className="text-xs px-2 py-0.5 bg-indigo-900/50 text-indigo-400 rounded-full">{asset.type}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">Purchased: {formatDate(asset.purchaseDate)}</p>
                  {asset.notes && <p className="text-gray-500 text-xs">{asset.notes}</p>}
                </div>
                <div className="text-right mr-4">
                  <p className="text-white font-semibold">{formatCurrency(stats.currentValue)}</p>
                  <p className={`text-xs ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)} ({formatPercent(stats.pnlPercent)})
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditAsset(asset)} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded-lg">✏️</button>
                  <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Other Asset">
        <OtherForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Asset">
        <OtherForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
    </div>
  );
}
