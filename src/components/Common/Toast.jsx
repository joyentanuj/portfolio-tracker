import React from 'react';
import { XCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

export default function Toast() {
  const { toasts, dispatch } = usePortfolio();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto
            animate-[fadeInUp_0.3s_ease] min-w-[220px] max-w-xs
            ${toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
              : toast.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
            }
          `}
        >
          <span className="shrink-0">
            {toast.type === 'error'
              ? <XCircle className="w-5 h-5" />
              : toast.type === 'warning'
              ? <AlertTriangle className="w-5 h-5" />
              : <CheckCircle2 className="w-5 h-5 text-green-600" />}
          </span>
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
