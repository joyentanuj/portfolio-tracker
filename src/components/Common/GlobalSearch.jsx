import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_LABELS } from '../../utils/constants';

const CATEGORY_ROUTES = {
  stocks: '/stocks',
  usStocks: '/us-stocks',
  mutualFunds: '/mutual-funds',
  fixedDeposits: '/fixed-deposits',
  gold: '/gold-silver',
  silver: '/gold-silver',
  cash: '/cash',
  realEstate: '/real-estate',
  others: '/others',
};

export default function GlobalSearch({ isOpen, onClose }) {
  const { data } = usePortfolio();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];
    const categories = ['stocks', 'usStocks', 'mutualFunds', 'fixedDeposits', 'gold', 'silver', 'cash', 'realEstate', 'others'];
    for (const cat of categories) {
      for (const asset of (data[cat] || [])) {
        const name = (asset.name || asset.symbol || asset.schemeName || asset.bankName || '').toLowerCase();
        const symbol = (asset.symbol || '').toLowerCase();
        if (name.includes(q) || symbol.includes(q)) {
          matches.push({
            id: asset.id,
            label: asset.name || asset.symbol || asset.schemeName || asset.bankName || 'Unknown',
            sublabel: CATEGORY_LABELS[cat],
            route: CATEGORY_ROUTES[cat],
          });
        }
      }
    }
    return matches.slice(0, 8);
  }, [query, data]);

  if (!isOpen) return null;

  const handleSelect = (route) => {
    navigate(route);
    setQuery('');
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search holdings..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:outline-none placeholder-gray-400"
          />
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        {results.length > 0 ? (
          <ul className="py-2 max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelect(r.route)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                >
                  <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{r.label}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs">{r.sublabel}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">No results for &ldquo;{query}&rdquo;</div>
        ) : (
          <div className="py-6 text-center text-gray-400 dark:text-gray-500 text-xs">Start typing to search your holdings</div>
        )}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">↵</kbd> go</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
