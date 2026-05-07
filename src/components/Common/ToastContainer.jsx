import React from 'react';
import Toast from './Toast';
import { useToast } from '../../hooks/useToast';

export default function ToastContainer({ position = 'bottom-right' }) {
  const { toasts, removeToast } = useToast();
  if (!toasts.length) return null;

  const positionClass = position === 'top-right' ? 'top-4 right-4' : 'bottom-4 right-4';

  return (
    <div className={`fixed ${positionClass} z-[100] flex flex-col gap-2 pointer-events-none`}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
