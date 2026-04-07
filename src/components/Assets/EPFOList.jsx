import React, { useState } from 'react';
import { Pencil, Trash2, HardHat } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import ConfirmDialog from '../Common/ConfirmDialog';
import EmptyState from '../Common/EmptyState';

function EPFOForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState(() => {
    const base = {
      uan: '',
      employerName: '',
      dateOfJoining: '',
      employeeContribution: '',
      employerContribution: '',
      currentBalance: '',
      ...initial,
    };
    return {
      ...base,
      employeeContribution: base.employeeContribution != null ? String(base.employeeContribution) : '',
      employerContribution: base.employerContribution != null ? String(base.employerContribution) : '',
      currentBalance: base.currentBalance != null ? String(base.currentBalance) : '',
    };
  });
  const [err, setErr] = useState('');

  const ic = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500 dark:placeholder-gray-400';
  const lc = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employerName.trim()) return setErr('Employer name is required');
    if (!form.employeeContribution || isNaN(form.employeeContribution) || Number(form.employeeContribution) < 0)
      return setErr('Enter valid employee contribution');
    if (!form.employerContribution || isNaN(form.employerContribution) || Number(form.employerContribution) < 0)
      return setErr('Enter valid employer contribution');
    if (!form.currentBalance || isNaN(form.currentBalance) || Number(form.currentBalance) < 0)
      return setErr('Enter valid current balance');
    setErr('');
    onSubmit({
      ...form,
      employeeContribution: Number(form.employeeContribution),
      employerContribution: Number(form.employerContribution),
      currentBalance: Number(form.currentBalance),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lc}>UAN (Universal Account Number, optional)</label>
        <input className={ic} value={form.uan} onChange={e => set('uan', e.target.value)} placeholder="e.g. 100XXXXXXXXX" />
      </div>
      <div>
        <label className={lc}>Employer Name</label>
        <input className={ic} value={form.employerName} onChange={e => set('employerName', e.target.value)} placeholder="e.g. Acme Corp Pvt Ltd" />
      </div>
      <div>
        <label className={lc}>Date of Joining (optional)</label>
        <input type="date" className={ic} value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Employee Contribution (₹)</label>
          <input type="number" className={ic} value={form.employeeContribution} onChange={e => set('employeeContribution', e.target.value)} min="0" placeholder="0" />
        </div>
        <div>
          <label className={lc}>Employer Contribution (₹)</label>
          <input type="number" className={ic} value={form.employerContribution} onChange={e => set('employerContribution', e.target.value)} min="0" placeholder="0" />
        </div>
      </div>
      <div>
        <label className={lc}>Current Balance (₹) — from EPFO passbook</label>
        <input type="number" className={ic} value={form.currentBalance} onChange={e => set('currentBalance', e.target.value)} min="0" placeholder="0" />
      </div>

      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add EPFO Account'}</Button>
      </div>
    </form>
  );
}

function EPFOCard({ account, stats, onEdit, onDelete }) {
  const interestEarned = stats.pnl;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-sky-500 shrink-0" />
            <p className="text-gray-900 dark:text-gray-100 font-bold text-base">{account.employerName}</p>
          </div>
          <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {account.uan && <span>UAN: {account.uan}</span>}
            {account.dateOfJoining && <span>Joined: {formatDate(account.dateOfJoining)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Employee Contrib</p>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(account.employeeContribution || 0)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Employer Contrib</p>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(account.employerContribution || 0)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Interest Earned</p>
          <p className={`font-medium ${interestEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {interestEarned >= 0 ? '+' : ''}{formatCurrency(interestEarned)}
            <span className="text-xs ml-1">({formatPercent(stats.pnlPercent)})</span>
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs">Total PF Balance</span>
        <span className="text-gray-900 dark:text-gray-100 font-bold text-base">{formatCurrency(stats.currentValue)}</span>
      </div>
    </div>
  );
}

export default function EPFOList() {
  const { data, getAssetStats, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const accounts = data.epfo || [];

  const handleAdd = (form) => {
    addAsset('epfo', { ...form, category: 'epfo' });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('epfo', editAccount.id, form);
    setEditAccount(null);
  };

  const handleConfirmDelete = () => {
    deleteAsset('epfo', confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add EPFO Account</Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<HardHat />}
          title="No EPFO accounts added"
          description="Track your Employee Provident Fund balance and contributions"
          actionLabel="Add EPFO Account"
          onAction={() => setAddModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map(account => {
            const stats = getAssetStats(account, 'epfo');
            return (
              <EPFOCard
                key={account.id}
                account={account}
                stats={stats}
                onEdit={() => setEditAccount(account)}
                onDelete={() => setConfirmDelete(account.id)}
              />
            );
          })}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add EPFO Account" size="md">
        <EPFOForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAccount} onClose={() => setEditAccount(null)} title="Edit EPFO Account" size="md">
        <EPFOForm onSubmit={handleEdit} onCancel={() => setEditAccount(null)} initial={editAccount} />
      </Modal>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete EPFO Account?"
        description="This will permanently delete this EPFO account and all its data."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
