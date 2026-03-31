import React, { useRef } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { usePortfolio } from '../context/PortfolioContext';
import { clearPortfolioData } from '../utils/storage';

export default function Settings() {
  const { data, updateData, updateSettings, showToast } = usePortfolio();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Portfolio exported successfully');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        // Basic validation
        if (typeof imported !== 'object' || Array.isArray(imported)) {
          throw new Error('Invalid format');
        }
        if (window.confirm('This will replace your current portfolio data. Are you sure?')) {
          updateData(imported);
          showToast('Portfolio imported successfully');
        }
      } catch {
        showToast('Failed to import: invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear ALL portfolio data? This cannot be undone.')) {
      if (window.confirm('This will permanently delete all your data. Last chance!')) {
        clearPortfolioData();
        window.location.reload();
      }
    }
  };

  const settings = data.settings || {};

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Auto-refresh Settings */}
      <Card title="⚙️ Auto-Refresh Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">Auto-refresh prices</p>
              <p className="text-gray-400 text-xs">Automatically fetch live prices on a timer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefresh ?? true}
                onChange={e => updateSettings({ autoRefresh: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>

          {settings.autoRefresh && (
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1">Refresh interval (seconds)</label>
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                value={settings.refreshInterval ?? 60}
                onChange={e => updateSettings({ refreshInterval: Number(e.target.value) })}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Data Management */}
      <Card title="💾 Data Management">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700">
            <div>
              <p className="text-white font-medium text-sm">Export Portfolio</p>
              <p className="text-gray-400 text-xs">Download your data as JSON for backup</p>
            </div>
            <Button onClick={handleExport} size="sm" icon="⬇️">Export JSON</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700">
            <div>
              <p className="text-white font-medium text-sm">Import Portfolio</p>
              <p className="text-gray-400 text-xs">Restore from a previously exported backup</p>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="secondary" icon="⬆️">Import JSON</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-xl border border-red-800/50">
            <div>
              <p className="text-red-400 font-medium text-sm">Clear All Data</p>
              <p className="text-gray-400 text-xs">Permanently delete all portfolio data</p>
            </div>
            <Button onClick={handleClear} size="sm" variant="danger" icon="🗑️">Clear Data</Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card title="ℹ️ About">
        <div className="space-y-3 text-sm text-gray-400">
          <p>📊 <strong className="text-white">Live Portfolio Tracker</strong> v1.0</p>
          <p>All data is stored locally in your browser's localStorage. No data is sent to any server.</p>
          <div className="space-y-1">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Data Sources</p>
            <p>• Stocks: Yahoo Finance API (via CORS proxy)</p>
            <p>• Mutual Funds: MFAPI.in</p>
            <p>• Gold/Silver: Goldprice.org (with fallback)</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Calculations</p>
            <p>• XIRR uses Newton-Raphson method</p>
            <p>• FD values use compound interest formula</p>
            <p>• All amounts in Indian Rupees (₹)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
