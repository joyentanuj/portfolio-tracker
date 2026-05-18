import React, { useState } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency } from '../utils/formatters';

export default function Alerts() {
  const { data, addAlert, deleteAlert, updateData } = usePortfolio();
  const [form, setForm] = useState({ assetName: '', symbol: '', type: 'above', targetPrice: '', targetPercent: '' });

  const alerts = data.alerts || [];
  const triggeredCount = alerts.filter((a) => a.triggered && !a.notified).length;

  return (
    <div className="space-y-6">
      <Card title="Price Alerts" subtitle={`${triggeredCount} triggered alerts`}>
        <form
          className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            addAlert({
              ...form,
              targetPrice: Number(form.targetPrice || 0),
              targetPercent: Number(form.targetPercent || 0),
            });
            setForm({ assetName: '', symbol: '', type: 'above', targetPrice: '', targetPercent: '' });
          }}
        >
          <input value={form.assetName} onChange={(e) => setForm((f) => ({ ...f, assetName: e.target.value }))} placeholder="Asset name" className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} placeholder="Symbol" className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <option value="above">Above X</option>
            <option value="below">Below X</option>
            <option value="pctChange">% Change</option>
          </select>
          {form.type === 'pctChange' ? (
            <input value={form.targetPercent} type="number" onChange={(e) => setForm((f) => ({ ...f, targetPercent: e.target.value }))} placeholder="Percent" className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          ) : (
            <input value={form.targetPrice} type="number" onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))} placeholder="Target price" className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          )}
          <Button type="submit" size="sm">Set Alert</Button>
        </form>

        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border ${alert.triggered ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.assetName || alert.symbol}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {alert.type === 'pctChange' ? `Daily move ≥ ${alert.targetPercent || alert.targetPrice}%` : `${alert.type === 'above' ? 'Above' : 'Below'} ${formatCurrency(alert.targetPrice)}`}
                  </p>
                  {alert.triggered && <p className="text-xs text-red-600 dark:text-red-300">Triggered at {formatCurrency(alert.currentPrice)} · {new Date(alert.triggeredAt).toLocaleString()}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {alert.triggered && !alert.notified && (
                    <button
                      onClick={() => {
                        const updatedAlerts = alerts.map((a) => (a.id === alert.id ? { ...a, notified: true } : a));
                        updateData({ ...data, alerts: updatedAlerts });
                      }}
                      className="px-2 py-1 text-xs rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    >
                      Mark read
                    </button>
                  )}
                  <button onClick={() => deleteAlert(alert.id)} className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No alerts configured yet.</p>}
        </div>
      </Card>
    </div>
  );
}
