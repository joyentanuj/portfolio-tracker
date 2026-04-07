import { useState } from 'react';

const KEY = 'portfolio_table_density';

export default function useTableDensity() {
  const [dense, setDense] = useState(() => {
    try { return localStorage.getItem(KEY) === 'compact'; } catch { return false; }
  });

  const toggle = () => setDense(d => {
    const next = !d;
    try { localStorage.setItem(KEY, next ? 'compact' : 'comfortable'); } catch { /* ignore */ }
    return next;
  });

  return { dense, toggle };
}
