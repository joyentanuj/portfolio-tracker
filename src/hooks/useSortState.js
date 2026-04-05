import { useState } from 'react';

/**
 * Reusable sort state for table columns.
 * Cycles through: default → ascending → descending → default.
 */
export default function useSortState() {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(null);

  const handleSort = (colKey) => {
    if (sortCol !== colKey) {
      setSortCol(colKey);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortCol(null);
      setSortDir(null);
    }
  };

  return { sortCol, sortDir, handleSort };
}
