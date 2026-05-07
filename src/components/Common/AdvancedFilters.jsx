import React from 'react';
import { X } from 'lucide-react';

export default function AdvancedFilters({ categories = [], filters, onChange, onClear }) {
  const chip = (label, key) => (
    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px]">
      {label}
    </span>
  );

  const activeChips = [];
  if (filters.search) activeChips.push(chip(`Search: ${filters.search}`, 'search'));
  if (filters.categories?.length) activeChips.push(chip(`Categories: ${filters.categories.length}`, 'categories'));
  if (filters.startDate || filters.endDate) activeChips.push(chip('Date range', 'date'));
  if (filters.minInvested || filters.maxInvested) activeChips.push(chip('Investment range', 'invested'));
  if (filters.minPnlPct || filters.maxPnlPct) activeChips.push(chip('P&L% range', 'pnl'));

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          value={filters.search}
          onChange={(e) => onChange(prev => ({ ...prev, search: e.target.value }))}
          placeholder="Search asset"
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />

        <div className="md:col-span-2 grid grid-cols-2 gap-2">
          <input type="date" value={filters.startDate} onChange={(e) => onChange(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <input type="date" value={filters.endDate} onChange={(e) => onChange(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min ₹" value={filters.minInvested} onChange={(e) => onChange(prev => ({ ...prev, minInvested: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <input type="number" placeholder="Max ₹" value={filters.maxInvested} onChange={(e) => onChange(prev => ({ ...prev, maxInvested: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.1" placeholder="Min P&L %" value={filters.minPnlPct} onChange={(e) => onChange(prev => ({ ...prev, minPnlPct: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <input type="number" step="0.1" placeholder="Max P&L %" value={filters.maxPnlPct} onChange={(e) => onChange(prev => ({ ...prev, maxPnlPct: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <label key={cat.value} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={filters.categories.includes(cat.value)}
              onChange={(e) => onChange(prev => ({
                ...prev,
                categories: e.target.checked
                  ? [...prev.categories, cat.value]
                  : prev.categories.filter(c => c !== cat.value),
              }))}
            />
            {cat.label}
          </label>
        ))}

        <button onClick={onClear} className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          <X className="w-3 h-3" /> Clear all
        </button>
      </div>

      {activeChips.length > 0 && <div className="flex flex-wrap gap-1.5">{activeChips}</div>}
    </div>
  );
}
