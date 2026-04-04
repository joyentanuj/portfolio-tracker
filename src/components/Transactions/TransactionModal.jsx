import React, { useState } from 'react';
import Modal from '../Common/Modal';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import { usePortfolio } from '../../context/PortfolioContext';

export default function TransactionModal({ isOpen, onClose, asset, category }) {
  const { addTransaction, updateTransaction, deleteTransaction } = usePortfolio();
  const [editingTx, setEditingTx] = useState(null);
  const [showForm, setShowForm] = useState(false);

  if (!asset) return null;

  const handleAdd = (txData) => {
    addTransaction(category, asset.id, txData);
    setShowForm(false);
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setShowForm(true);
  };

  const handleUpdate = (txData) => {
    updateTransaction(category, asset.id, editingTx.id, txData);
    setEditingTx(null);
    setShowForm(false);
  };

  const handleDelete = (txId) => {
    if (window.confirm('Delete this transaction?')) {
      deleteTransaction(category, asset.id, txId);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTx(null);
    onClose();
  };

  const assetName = asset.name || asset.symbol || asset.schemeName || 'Asset';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Transactions — ${assetName}`} size="lg">
      {showForm ? (
        <div>
          <h3 className="text-gray-300 text-sm font-medium mb-4">
            {editingTx ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <TransactionForm
            onSubmit={editingTx ? handleUpdate : handleAdd}
            onCancel={() => { setShowForm(false); setEditingTx(null); }}
            initialData={editingTx || null}
            assetType={category}
          />
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">{(asset.transactions || []).length} transactions</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              + Add Transaction
            </button>
          </div>
          <TransactionList
            transactions={asset.transactions || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            assetType={category}
          />
        </div>
      )}
    </Modal>
  );
}
