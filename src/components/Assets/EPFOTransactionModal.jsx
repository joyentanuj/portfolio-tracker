import React, { useState } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';

function EPFOTransactionForm({ onSubmit, onCancel, accountName, initialTx = null }) {
  const [form, setForm] = useState(() => {
    const base = {
      date: new Date().toISOString().split('T')[0],
      employeeAmount: '',
      employerAmount: '',
      vpfAmount: '0',
      interestEarned: '0',
      notes: '',
      ...initialTx,
    };
    return {
      ...base,
      employeeAmount: base.employeeAmount != null ? String(base.employeeAmount) : '',
      employerAmount: base.employerAmount != null ? String(base.employerAmount) : '',
      vpfAmount: base.vpfAmount != null ? String(base.vpfAmount) : '0',
      interestEarned: base.interestEarned != null ? String(base.interestEarned) : '0',
      notes: base.notes || '',
    };
  });
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isInvalidAmount = (value) => value === '' || Number.isNaN(Number(value)) || Number(value) < 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.date) return setErr('Transaction date is required');
    if (isInvalidAmount(form.employeeAmount))
      return setErr('Enter valid employee contribution');
    if (isInvalidAmount(form.employerAmount))
      return setErr('Enter valid employer contribution');

    setErr('');
    onSubmit({
      date: form.date,
      type: 'contribution',
      employeeAmount: Number(form.employeeAmount),
      employerAmount: Number(form.employerAmount),
      vpfAmount: Number(form.vpfAmount) || 0,
      interestEarned: Number(form.interestEarned) || 0,
      notes: form.notes,
    });
  };

  const ic = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 mb-4">
        <p className="text-indigo-900 dark:text-indigo-200 text-xs font-medium">Adding transaction to: <strong>{accountName}</strong></p>
      </div>

      <div>
        <label className={lc}>Transaction Date</label>
        <input
          type="date"
          className={ic}
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Usually the last day of the month</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lc}>Employee Contribution (₹)</label>
          <input
            type="number"
            className={ic}
            value={form.employeeAmount}
            onChange={(e) => set('employeeAmount', e.target.value)}
            placeholder="e.g. 1800"
            min="0"
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">12% of basic salary</p>
        </div>
        <div>
          <label className={lc}>Employer Contribution (₹)</label>
          <input
            type="number"
            className={ic}
            value={form.employerAmount}
            onChange={(e) => set('employerAmount', e.target.value)}
            placeholder="e.g. 1800"
            min="0"
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Employer&apos;s 12%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lc}>VPF (Voluntary PF) — Optional</label>
          <input
            type="number"
            className={ic}
            value={form.vpfAmount}
            onChange={(e) => set('vpfAmount', e.target.value)}
            placeholder="0"
            min="0"
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Extra voluntary contribution</p>
        </div>
        <div>
          <label className={lc}>Interest Earned — Optional</label>
          <input
            type="number"
            className={ic}
            value={form.interestEarned}
            onChange={(e) => set('interestEarned', e.target.value)}
            placeholder="0"
            min="0"
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Interest credited this month</p>
        </div>
      </div>

      <div>
        <label className={lc}>Notes (Optional)</label>
        <input
          className={ic}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="e.g. January 2024 salary deduction"
        />
      </div>

      {err && <p className="text-red-600 text-xs">{err}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialTx ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}

export default function EPFOTransactionModal({ isOpen, onClose, account, onAddTransaction, onUpdateTransaction, initialTx = null }) {
  const handleSubmit = (txData) => {
    if (!account) return;
    if (initialTx && onUpdateTransaction) {
      onUpdateTransaction(account.id, initialTx.id, txData);
    } else if (onAddTransaction) {
      onAddTransaction(account.id, txData);
    }
    onClose();
  };

  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialTx ? 'Edit EPFO Transaction' : 'Add EPFO Transaction'} size="md">
      <EPFOTransactionForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        accountName={account?.employerName || 'EPFO Account'}
        initialTx={initialTx}
      />
    </Modal>
  );
}
