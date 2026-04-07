import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import ConfirmDialog from '../Common/ConfirmDialog';
import EmptyState from '../Common/EmptyState';

function CashForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({
    name: '',
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

  const ic = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500 dark:placeholder-gray-400';
  const lc = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';
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
      {err && <p className="text-red-600 text-xs">{err}</p>}
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
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const handleDelete = (id) => setConfirmDelete(id);
  const handleConfirmDelete = () => {
    deleteAsset('cash', confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{cashItems.length} accounts</p>
          <p className="text-gray-900 dark:text-gray-100 font-bold text-lg">{formatCurrency(totalCash)} total</p>
        </div>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add Cash</Button>
      </div>

      {cashItems.length === 0 ? (
        <EmptyState
          icon="💵"
          title="No cash entries"
          description="Track your savings accounts, wallets, and cash"
          actionLabel="Add Cash"
          onAction={() => setAddModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {cashItems.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">{item.name}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                  As of {formatDate(item.date)}{item.notes ? ` · ${item.notes}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-green-600 font-bold text-lg">{formatCurrency(item.amount)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditAsset(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Remove Cash Entry?"
        description="This will permanently remove this cash entry."
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
