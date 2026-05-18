import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import Modal from '../Common/Modal';
import ConfirmDialog from '../Common/ConfirmDialog';
import EPFOTransactionModal from './EPFOTransactionModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

function TransactionRow({ tx, onEdit, onDelete }) {
  const totalContribution = (tx.employeeAmount || 0) + (tx.employerAmount || 0) + (tx.vpfAmount || 0);

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(tx.date)}
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
        {formatCurrency(tx.employeeAmount || 0)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
        {formatCurrency(tx.employerAmount || 0)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right">
        {tx.vpfAmount > 0 ? formatCurrency(tx.vpfAmount) : '—'}
      </td>
      <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400 text-right">
        {tx.interestEarned > 0 ? `+${formatCurrency(tx.interestEarned)}` : '—'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 text-right font-semibold">
        {formatCurrency(totalContribution)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-400 dark:text-gray-500">
        {tx.notes || '—'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function EPFOTransactionHistory({ isOpen, onClose, account, onUpdateTransaction, onDeleteTransaction }) {
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTxId, setDeletingTxId] = useState(null);

  const transactions = useMemo(
    () => [...(account?.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [account?.transactions]
  );

  const handleDelete = () => {
    if (!account || !deletingTxId) return;
    onDeleteTransaction(account.id, deletingTxId);
    setDeletingTxId(null);
  };

  if (!account) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Transaction History - ${account.employerName}`} size="xl">
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Add your first transaction to start tracking contributions</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Total Contributed: <strong className="text-gray-900 dark:text-gray-100">{formatCurrency(
                    transactions.reduce((sum, tx) => sum + (tx.employeeAmount || 0) + (tx.employerAmount || 0) + (tx.vpfAmount || 0), 0)
                  )}</strong></span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employer</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VPF</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interest</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        onEdit={() => setEditingTx(tx)}
                        onDelete={() => setDeletingTxId(tx.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>

      <EPFOTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        account={account}
        onUpdateTransaction={onUpdateTransaction}
        initialTx={editingTx}
      />

      <ConfirmDialog
        isOpen={!!deletingTxId}
        title="Delete Transaction?"
        description="This will permanently delete this transaction. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingTxId(null)}
      />
    </>
  );
}
