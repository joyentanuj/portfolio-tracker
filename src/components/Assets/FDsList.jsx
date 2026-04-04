import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatXIRR, formatDate } from '../../utils/formatters';
import { COMPOUNDING_FREQUENCIES } from '../../utils/constants';
import Button from '../Common/Button';
import Modal from '../Common/Modal';

function FDForm({ onSubmit, onCancel, initial = null }) {
  const [form, setForm] = useState({
    bankName: '',
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    compoundingFrequency: 'quarterly',
    notes: '',
    ...initial,
    principal: initial?.principal ?? '',
    interestRate: initial?.interestRate ?? '',
  });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bankName.trim()) return setErr('Bank name is required');
    if (!form.principal || isNaN(form.principal) || Number(form.principal) <= 0) return setErr('Enter valid principal');
    if (!form.interestRate || isNaN(form.interestRate) || Number(form.interestRate) <= 0) return setErr('Enter valid interest rate');
    if (!form.startDate) return setErr('Start date is required');
    setErr('');
    onSubmit({ ...form, principal: Number(form.principal), interestRate: Number(form.interestRate) });
  };

  const ic = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-indigo-500';
  const lc = 'block text-gray-600 text-xs font-medium mb-1';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lc}>Bank / Institution</label>
        <input className={ic} value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="e.g. SBI, HDFC Bank" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Principal Amount (₹)</label>
          <input type="number" className={ic} value={form.principal} onChange={e => set('principal', e.target.value)} placeholder="100000" min="0" />
        </div>
        <div>
          <label className={lc}>Interest Rate (% p.a.)</label>
          <input type="number" className={ic} value={form.interestRate} onChange={e => set('interestRate', e.target.value)} placeholder="7.5" min="0" step="0.01" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Start Date</label>
          <input type="date" className={ic} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div>
          <label className={lc}>Maturity Date</label>
          <input type="date" className={ic} value={form.maturityDate} onChange={e => set('maturityDate', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={lc}>Compounding Frequency</label>
        <select className={ic} value={form.compoundingFrequency} onChange={e => set('compoundingFrequency', e.target.value)}>
          {COMPOUNDING_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div>
        <label className={lc}>Notes (optional)</label>
        <input className={ic} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Account number, branch..." />
      </div>
      {err && <p className="text-red-600 text-xs">{err}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add FD'}</Button>
      </div>
    </form>
  );
}

export default function FDsList() {
  const { data, getAssetStats, addAsset, updateAsset, deleteAsset } = usePortfolio();
  const [addModal, setAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const fds = data.fixedDeposits || [];

  const handleAdd = (form) => {
    addAsset('fixedDeposits', { ...form, category: 'fixedDeposits' });
    setAddModal(false);
  };

  const handleEdit = (form) => {
    updateAsset('fixedDeposits', editAsset.id, form);
    setEditAsset(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this FD?')) deleteAsset('fixedDeposits', id);
  };

  const now = new Date();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 text-sm">{fds.length} fixed deposits</p>
        <Button onClick={() => setAddModal(true)} icon="+" size="sm">Add FD</Button>
      </div>

      {fds.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🏛️</div>
          <p className="font-medium text-gray-500 mb-1">No fixed deposits added</p>
          <p className="text-sm">Add your FDs to track their maturity and returns</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fds.map(fd => {
            const stats = getAssetStats(fd, 'fixedDeposits');
            const isMatured = fd.maturityDate && new Date(fd.maturityDate) < now;
            const daysLeft = fd.maturityDate ? Math.ceil((new Date(fd.maturityDate) - now) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={fd.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 font-semibold">{fd.bankName}</p>
                      {isMatured
                        ? <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">Matured</span>
                        : daysLeft !== null && daysLeft <= 30
                        ? <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">Matures in {daysLeft}d</span>
                        : <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">Active</span>
                      }
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {fd.interestRate}% p.a. · {COMPOUNDING_FREQUENCIES.find(f => f.value === fd.compoundingFrequency)?.label || fd.compoundingFrequency}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditAsset(fd)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">✏️</button>
                    <button onClick={() => handleDelete(fd.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Principal</p>
                    <p className="text-gray-900 font-medium">{formatCurrency(fd.principal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Current Value</p>
                    <p className="text-green-600 font-medium">{formatCurrency(stats.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Interest Earned</p>
                    <p className={`font-medium ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(stats.pnl)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">XIRR</p>
                    <p className={`font-medium ${stats.xirr >= 0 ? 'text-green-600' : 'text-gray-500'}`}>{formatXIRR(stats.xirr)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400">
                  <span>Start: {formatDate(fd.startDate)}</span>
                  <span>Maturity: {fd.maturityDate ? formatDate(fd.maturityDate) : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Fixed Deposit">
        <FDForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Fixed Deposit">
        <FDForm onSubmit={handleEdit} onCancel={() => setEditAsset(null)} initial={editAsset} />
      </Modal>
    </div>
  );
}
