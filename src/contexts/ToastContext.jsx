/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { toasts, showToast, dispatch } = usePortfolio();

  const value = useMemo(() => ({
    toasts,
    showToast,
    removeToast: (id) => dispatch({ type: 'REMOVE_TOAST', payload: id }),
  }), [toasts, showToast, dispatch]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}
