import React from 'react';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import Button from '../Common/Button';

export default function TransactionList({ transactions = [], onEdit, onDelete, assetType }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        No transactions yet. Add your first transaction.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left text-gray-400 text-xs font-medium py-2 pr-4">Type</th>
            <th className="text-left text-gray-400 text-xs font-medium py-2 pr-4">Date</th>
            <th className="text-right text-gray-400 text-xs font-medium py-2 pr-4">
              {assetType === 'gold' || assetType === 'silver' ? 'Weight (g)' : 'Qty'}
            </th>
            <th className="text-right text-gray-400 text-xs font-medium py-2 pr-4">Price</th>
            <th className="text-right text-gray-400 text-xs font-medium py-2 pr-4">Amount</th>
            <th className="text-right text-gray-400 text-xs font-medium py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => (
            <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
              <td className="py-2.5 pr-4">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  tx.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {tx.type?.toUpperCase()}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-gray-300">{formatDate(tx.date)}</td>
              <td className="py-2.5 pr-4 text-right text-white">{formatNumber(tx.quantity, 4)}</td>
              <td className="py-2.5 pr-4 text-right text-gray-300">{formatCurrency(tx.price)}</td>
              <td className="py-2.5 pr-4 text-right font-medium text-white">{formatCurrency(tx.amount)}</td>
              <td className="py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
