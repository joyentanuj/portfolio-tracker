import { useMemo, useState } from 'react';

const DEFAULT_FILTERS = {
  search: '',
  categories: [],
  startDate: '',
  endDate: '',
  minInvested: '',
  maxInvested: '',
  minPnlPct: '',
  maxPnlPct: '',
};

export function useFilters(initial = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initial });

  const activeCount = useMemo(() => Object.entries(filters).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : String(v).trim() !== ''
  ).length, [filters]);

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS, ...initial });

  return { filters, setFilters, clearFilters, activeCount };
}
