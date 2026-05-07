import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
const RECENT_KEY = 'portfolio_tracker_recent_searches';

const normalize = (s = '') => s.toLowerCase().trim();
const fuzzyMatch = (text, query) => {
  const t = normalize(text);
  const q = normalize(query);
  if (!q) return false;
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) if (t[i] === q[qi]) qi++;
  return qi === q.length;
};

function highlight(text = '', query = '') {
  if (!query.trim()) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return <>{text.slice(0, i)}<mark className="bg-yellow-200 dark:bg-yellow-700/60 rounded px-0.5">{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>;
}

export default function GlobalSearch({ isOpen, onClose }) {
  const { data } = usePortfolio();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const grouped = useMemo(() => {
    if (!debounced.trim()) return {};
    const out = {};
    Object.keys(CATEGORY_ROUTES).forEach(cat => {
      (data[cat] || []).forEach(asset => {
        const label = asset.name || asset.symbol || asset.schemeName || asset.bankName || 'Unknown';
        const symbol = asset.symbol || '';
        if (fuzzyMatch(label, debounced) || fuzzyMatch(symbol, debounced)) {
          out[cat] = out[cat] || [];
          out[cat].push({ id: asset.id, label, symbol, route: CATEGORY_ROUTES[cat], category: cat });
        }
      });
    });
    return out;
  }, [debounced, data]);

  const results = useMemo(() => Object.values(grouped).flat().slice(0, 12), [grouped]);

  const persistRecent = useCallback((term) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter(r => r !== term)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSelect = useCallback((entry) => {
    navigate(entry.route);
    if (query.trim()) persistRecent(query.trim());
    setQuery('');
    setActiveIdx(0);
    onClose();
  }, [navigate, query, onClose, persistRecent]);

  const handleClose = () => {
    setQuery('');
    setActiveIdx(0);
    onClose();
  };

  useEffect(() => {
    const handler = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(v => Math.min(results.length - 1, v + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(v => Math.max(0, v - 1));
      }
      if (e.key === 'Enter' && results[activeIdx]) {
        e.preventDefault();
        handleSelect(results[activeIdx]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, results, activeIdx, onClose, handleSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search assets, symbols, categories..." className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:outline-none placeholder-gray-400" />
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
        </div>

        {results.length > 0 ? (
          <div className="py-2 max-h-80 overflow-y-auto">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="px-4 py-1 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{CATEGORY_LABELS[cat]}</p>
                {items.map((r) => {
                  const idx = results.findIndex(x => x.id === r.id);
                  return (
                    <button key={r.id} onClick={() => handleSelect(r)} className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${idx === activeIdx ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{highlight(r.label, debounced)}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{r.symbol}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : debounced.trim() ? (
          <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">No results for &ldquo;{debounced}&rdquo;</div>
        ) : (
          <div className="p-4 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Recent searches</p>
            {recent.length ? recent.map(r => (
              <button key={r} onClick={() => setQuery(r)} className="mr-2 mb-2 px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{r}</button>
            )) : <p className="text-xs text-gray-400 dark:text-gray-500">No recent searches</p>}
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">↵</kbd> open</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
