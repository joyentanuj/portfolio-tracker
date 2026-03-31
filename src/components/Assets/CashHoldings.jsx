import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';

function CashForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    ...initial,
    amount: initial?.amount ?? '',
  });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Name is required');
    if (!form.amount || isNaN(form.amount) || Number(form.amount) < 0) return setErr('Enter valid amount');
    setErr('');
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  const ic = 'w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-400 text-xs font-medium mb-1';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lc}>Account / Description</label>
        <input className={ic} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Savings Account, Wallet" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Amount (₹)</label>
          <input type="number" className={ic} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="50000" min="0" />
        </div>
        <div>
          <label className={lc}>As of Date</label>
          <input type="date" className={ic} value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={lc}>Notes (optional)</label>
        <input className={ic} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Bank name, account type..." />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Cash'}</Button>
      </div>
    </form>
  );
}

export default function CashHoldings() {
  const { data, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const cashItems = data.cash || [];
  const totalCash = cashItems.reduce((sum, c) => sum + (c.amount || 0), 0);

  const handleAdd = (form) => {
    addAsset('cash', { ...form, category: 'cash' });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('cash', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this cash entry?')) deleteAsset('cash', id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-gray-400 text-sm">{cashItems.length} accounts</p>
          <p className="text-white font-bold text-lg">{formatCurrency(totalCash)} total</p>
        </div>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Cash</Button>
      </div>

      {cashItems.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">💵</div>
          <p className="font-medium text-gray-400 mb-1">No cash entries</p>
          <p className="text-sm">Track your savings accounts, wallets, and cash</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cashItems.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-900 rounded-xl border border-gray-700 p-4">
              <div>
                <p className="text-white font-semibold">{item.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  As of {formatDate(item.date)}{item.notes ? ` · ${item.notes}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-green-400 font-bold text-lg">{formatCurrency(item.amount)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditAsset(item)} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded-lg">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Cash">
        <CashForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Cash">
        <CashForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
    </div>
  );
}
