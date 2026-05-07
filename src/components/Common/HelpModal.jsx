import React from 'react';
import { X } from 'lucide-react';

const SHORTCUTS = [
  ['j', 'Navigate to next page'],
  ['k', 'Navigate to previous page'],
  ['g', 'Go to dashboard'],
  ['⌘/Ctrl + k', 'Open global search'],
  ['?', 'Open this help'],
  ['Esc', 'Close dialogs/modals'],
];

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold">Help & Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close help">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Keyboard shortcuts</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {SHORTCUTS.map(([key, description]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <kbd className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">{key}</kbd>
                  <span className="text-gray-600 dark:text-gray-300 text-xs">{description}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key metrics</h3>
            <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
              <li><strong>XIRR:</strong> Annualized return accounting for irregular cash flows.</li>
              <li><strong>P&amp;L%:</strong> Profit/Loss as percentage of invested amount.</li>
              <li><strong>Volatility:</strong> Standard deviation of returns; higher means more variation.</li>
              <li><strong>Sharpe Ratio:</strong> Risk-adjusted return; higher is generally better.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">Tip: use filters and chart click interactions to quickly drill down by category.</p>
        </div>
      </div>
    </div>
  );
}
