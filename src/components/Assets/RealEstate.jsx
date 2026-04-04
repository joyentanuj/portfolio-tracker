import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatXIRR, formatDate, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';

function REForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    ...initial,
    purchasePrice: initial?.purchasePrice ?? '',
    currentValue: initial?.currentValue ?? '',
  });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Property name is required');
    if (!form.purchasePrice || isNaN(form.purchasePrice) || Number(form.purchasePrice) <= 0) return setErr('Enter valid purchase price');
    setErr('');
    onSubmit({
      ...form,
      purchasePrice: Number(form.purchasePrice),
      currentValue: form.currentValue ? Number(form.currentValue) : Number(form.purchasePrice),
    });
  };

  const ic = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-600 text-xs font-medium mb-1';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lc}>Property Name</label>
        <input className={ic} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 2BHK Apartment, Plot" />
      </div>
      <div>
        <label className={lc}>Location</label>
        <input className={ic} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore, Mumbai" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Purchase Price (₹)</label>
          <input type="number" className={ic} value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="5000000" min="0" />
        </div>
        <div>
          <label className={lc}>Current Value (₹)</label>
          <input type="number" className={ic} value={form.currentValue} onChange={e => set('currentValue', e.target.value)} placeholder="7000000" min="0" />
        </div>
      </div>
      <div>
        <label className={lc}>Purchase Date</label>
        <input type="date" className={ic} value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
      </div>
      <div>
        <label className={lc}>Notes</label>
        <input className={ic} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
      </div>
      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Property'}</Button>
      </div>
    </form>
  );
}

export default function RealEstate() {
  const { data, getAssetStats, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const properties = data.realEstate || [];

  const handleAdd = (form) => {
    addAsset('realEstate', { ...form, category: 'realEstate' });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('realEstate', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this property?')) deleteAsset('realEstate', id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 text-sm">{properties.length} properties</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Property</Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🏠</div>
          <p className="font-medium text-gray-500 mb-1">No real estate added</p>
          <p className="text-sm">Track your properties, plots, and real estate investments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map(prop => {
            const stats = getAssetStats(prop, 'realEstate');
            return (
              <div key={prop.id} className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-900 font-bold text-base">{prop.name}</p>
                    {prop.location && <p className="text-gray-500 text-sm">📍 {prop.location}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">Purchased: {formatDate(prop.purchaseDate)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditAsset(prop)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">✏️</button>
                    <button onClick={() => handleDelete(prop.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs">Purchase Price</p>
                    <p className="text-gray-900 font-medium">{formatCurrency(prop.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Current Value</p>
                    <p className="text-gray-900 font-medium">{formatCurrency(stats.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Appreciation</p>
                    <p className={`font-medium ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)} ({formatPercent(stats.pnlPercent)})
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">CAGR (approx)</p>
                    <p className={`font-medium ${stats.xirr !== null && stats.xirr >= 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {formatXIRR(stats.xirr)}
                    </p>
                  </div>
                </div>
                {prop.notes && <p className="text-gray-400 text-xs mt-3 pt-3 border-t border-gray-200">{prop.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Real Estate">
        <REForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Property">
        <REForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
    </div>
  );
}
