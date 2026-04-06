import React, { useState } from 'react';
import Button from '../Common/Button';

export default function TransactionForm({ onSubmit, onCancel, initialData = null, assetType }) {
  const [form, setForm] = useState({
    type: 'buy',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: '',
    notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0)
      errs.quantity = 'Enter a valid quantity';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      errs.price = 'Enter a valid price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const qty = Number(form.quantity);
    const price = Number(form.price);
    onSubmit({
      ...form,
      quantity: qty,
      price,
      amount: qty * price,
    });
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const inputClass = 'w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors dark:placeholder-gray-400';
  const labelClass = 'block text-gray-600 dark:text-gray-400 text-xs font-medium mb-1';
  const errorClass = 'text-red-600 text-xs mt-0.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type */}
      <div className="flex gap-2">
        {['buy', 'sell'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => set('type', t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
              form.type === t
                ? t === 'buy'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-red-50 border-red-500 text-red-700'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {t === 'buy' ? '↑ Buy' : '↓ Sell'}
          </button>
        ))}
      </div>

      {/* Date */}
      <div>
        <label className={labelClass}>Date</label>
        <input type="date" className={inputClass} value={form.date} onChange={e => set('date', e.target.value)} />
        {errors.date && <p className={errorClass}>{errors.date}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Quantity */}
        <div>
          <label className={labelClass}>{assetType === 'gold' || assetType === 'silver' ? 'Weight (grams)' : 'Quantity'}</label>
          <input
            type="number"
            className={inputClass}
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            placeholder="0"
            min="0"
            step="any"
          />
          {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
        </div>

        {/* Price */}
        <div>
          <label className={labelClass}>{assetType === 'gold' || assetType === 'silver' ? 'Price/gram (₹)' : 'Price per unit (₹)'}</label>
          <input
            type="number"
            className={inputClass}
            value={form.price}
            onChange={e => set('price', e.target.value)}
            placeholder="0"
            min="0"
            step="any"
          />
          {errors.price && <p className={errorClass}>{errors.price}</p>}
        </div>
      </div>

      {/* Total */}
      {form.quantity && form.price && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-gray-600">
          <span className="text-gray-600 dark:text-gray-400">Total: </span>
          <span className="text-gray-900 dark:text-gray-100 font-semibold">
            ₹{(Number(form.quantity) * Number(form.price)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <input
          type="text"
          className={inputClass}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any notes..."
          maxLength={200}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" variant={form.type === 'buy' ? 'success' : 'danger'} className="flex-1">
          {initialData ? 'Update' : form.type === 'buy' ? 'Add Buy' : 'Add Sell'}
        </Button>
      </div>
    </form>
  );
}
