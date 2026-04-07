import React, { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import ConfirmDialog from '../Common/ConfirmDialog';
import EmptyState from '../Common/EmptyState';

function computeMaturityDate(openingDate) {
  if (!openingDate) return null;
  const d = new Date(openingDate);
  d.setFullYear(d.getFullYear() + 15);
  return d.toISOString().split('T')[0];
}

function PPFForm({ onSubmit, onCancel, initial = null }) {
  const defaultContributions = initial?.annualContributions?.length
    ? initial.annualContributions
    : [{ year: new Date().getFullYear(), amount: '' }];

  const [form, setForm] = useState(() => {
    const base = {
      accountNumber: '',
      bankOrBranch: '',
      openingDate: '',
      interestRate: '7.1',
      currentBalance: '',
      ...initial,
    };
    return {
      ...base,
      interestRate: String(base.interestRate ?? '7.1'),
      currentBalance: base.currentBalance != null ? String(base.currentBalance) : '',
    };
  });
  const [contributions, setContributions] = useState(defaultContributions);
  const [err, setErr] = useState('');

  const ic = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500 dark:placeholder-gray-400';
  const lc = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const maturityDate = computeMaturityDate(form.openingDate);

  const addContribution = () => setContributions(c => [...c, { year: new Date().getFullYear(), amount: '' }]);
  const removeContribution = (i) => setContributions(c => c.filter((_, idx) => idx !== i));
  const setContribution = (i, k, v) => setContributions(c => c.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bankOrBranch.trim()) return setErr('Bank / Branch is required');
    if (!form.openingDate) return setErr('Opening date is required');
    if (!form.currentBalance || isNaN(form.currentBalance) || Number(form.currentBalance) < 0) return setErr('Enter valid current balance');
    setErr('');
    onSubmit({
      ...form,
      interestRate: Number(form.interestRate) || 7.1,
      currentBalance: Number(form.currentBalance),
      maturityDate,
      annualContributions: contributions
        .filter(c => c.amount !== '' && !isNaN(c.amount))
        .map(c => ({ year: Number(c.year), amount: Number(c.amount) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lc}>Account Number (optional)</label>
        <input className={ic} value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder="e.g. SB/001234/2010" />
      </div>
      <div>
        <label className={lc}>Bank / Branch</label>
        <input className={ic} value={form.bankOrBranch} onChange={e => set('bankOrBranch', e.target.value)} placeholder="e.g. SBI Main Branch" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Opening Date</label>
          <input type="date" className={ic} value={form.openingDate} onChange={e => set('openingDate', e.target.value)} />
        </div>
        <div>
          <label className={lc}>Maturity Date (auto)</label>
          <div className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
            {maturityDate ? formatDate(maturityDate) : '—'}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Interest Rate (%)</label>
          <input type="number" className={ic} value={form.interestRate} onChange={e => set('interestRate', e.target.value)} step="0.01" min="0" max="20" placeholder="7.1" />
        </div>
        <div>
          <label className={lc}>Current Balance (₹)</label>
          <input type="number" className={ic} value={form.currentBalance} onChange={e => set('currentBalance', e.target.value)} min="0" placeholder="0" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={lc + ' mb-0'}>Annual Contributions</label>
          <button type="button" onClick={addContribution} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">+ Add Year</button>
        </div>
        <div className="space-y-2">
          {contributions.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="number"
                className={ic + ' w-24'}
                value={row.year}
                onChange={e => setContribution(i, 'year', e.target.value)}
                placeholder="Year"
                min="1990"
                max="2100"
              />
              <input
                type="number"
                className={ic}
                value={row.amount}
                onChange={e => setContribution(i, 'amount', e.target.value)}
                placeholder="Amount (₹)"
                min="0"
              />
              {contributions.length > 1 && (
                <button type="button" onClick={() => removeContribution(i)} className="text-red-400 hover:text-red-600 shrink-0 text-sm">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add PPF Account'}</Button>
      </div>
    </form>
  );
}

function PPFCard({ account, stats, onEdit, onDelete }) {
  const [showContribs, setShowContribs] = useState(false);

  const openingDate = account.openingDate ? new Date(account.openingDate) : null;
  const maturityDate = account.maturityDate ? new Date(account.maturityDate) : null;
  const now = new Date();

  const yearsElapsed = openingDate ? Math.max(0, (now - openingDate) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
  const lockInProgress = Math.min(yearsElapsed / 15, 1);
  const isMatured = maturityDate ? now >= maturityDate : false;
  const yearsToMaturity = maturityDate ? Math.max(0, (maturityDate - now) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const maturityColor = isMatured
    ? 'text-green-600 dark:text-green-400'
    : yearsToMaturity !== null && yearsToMaturity <= 2
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-gray-500 dark:text-gray-400';

  const progressColor = isMatured ? 'bg-green-500' : 'bg-amber-500';

  const hasContributions = (account.annualContributions || []).length > 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-gray-900 dark:text-gray-100 font-bold text-base">{account.bankOrBranch}</p>
          </div>
          <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {account.accountNumber && <span>A/C: {account.accountNumber}</span>}
            {account.openingDate && <span>Opened: {formatDate(account.openingDate)}</span>}
            <span>Rate: {account.interestRate ?? 7.1}%</span>
            {account.maturityDate && <span className={maturityColor}>Matures: {formatDate(account.maturityDate)}{isMatured ? ' ✓' : ''}</span>}
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
          <p className="text-gray-400 dark:text-gray-500 text-xs">Invested</p>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(stats.investedValue)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Current Balance</p>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(stats.currentValue)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Interest Earned</p>
          <p className={`font-medium ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
            <span className="text-xs ml-1">({formatPercent(stats.pnlPercent)})</span>
          </p>
        </div>
      </div>

      {/* Lock-in progress bar */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Lock-in Progress</span>
          <span>{isMatured ? 'Matured' : `${Math.floor(yearsElapsed)}/15 years (${Math.round(lockInProgress * 100)}%)`}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${lockInProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Annual contributions toggle */}
      {hasContributions && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowContribs(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showContribs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {account.annualContributions.length} annual contribution{account.annualContributions.length !== 1 ? 's' : ''}
          </button>
          {showContribs && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {account.annualContributions.map((c, i) => (
                <div key={i} className="flex justify-between text-xs bg-white dark:bg-gray-700/50 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-gray-600">
                  <span className="text-gray-500 dark:text-gray-400">{c.year}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PPFList() {
  const { data, getAssetStats, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const accounts = data.ppf || [];

  const handleAdd = (form) => {
    addAsset('ppf', { ...form, category: 'ppf' });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('ppf', editAccount.id, form);
    setEditAccount(null);
  };

  const handleConfirmDelete = () => {
    deleteAsset('ppf', confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add PPF Account</Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<Shield />}
          title="No PPF accounts added"
          description="Track your Public Provident Fund accounts and lock-in progress"
          actionLabel="Add PPF Account"
          onAction={() => setAddModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map(account => {
            const stats = getAssetStats(account, 'ppf');
            return (
              <PPFCard
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

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add PPF Account" size="md">
        <PPFForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAccount} onClose={() => setEditAccount(null)} title="Edit PPF Account" size="md">
        <PPFForm onSubmit={handleEdit} onCancel={() => setEditAccount(null)} initial={editAccount} />
      </Modal>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete PPF Account?"
        description="This will permanently delete this PPF account and all its data."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
