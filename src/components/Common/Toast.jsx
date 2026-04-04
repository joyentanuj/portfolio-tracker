import React from 'react';
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
              ? 'bg-red-900/90 border-red-700 text-red-100'
              : toast.type === 'warning'
              ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100'
              : 'bg-gray-800 border-gray-600 text-white'
            }
          `}
        >
          <span className="text-lg">
            {toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'}
          </span>
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
