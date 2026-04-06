import React from 'react';

/**
 * A reusable sortable table header cell.
 * Props:
 *   label    – display text
 *   colKey   – unique identifier for this column
 *   sortCol  – currently active sort column key (or null)
 *   sortDir  – 'asc' | 'desc' | null
 *   onSort   – callback(colKey) called when the header is clicked
 *   className – optional extra classes for <th>
 */
export default function SortableHeader({ label, colKey, sortCol, sortDir, onSort, className = '' }) {
  const isActive = sortCol === colKey;

  return (
    <th
      className={`text-left text-gray-500 dark:text-gray-400 text-xs font-medium py-3 pr-4 last:pr-0 cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(colKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col leading-none text-[8px]">
          <span className={isActive && sortDir === 'asc' ? 'text-indigo-600' : 'text-gray-300 dark:text-gray-600'}>▲</span>
          <span className={isActive && sortDir === 'desc' ? 'text-indigo-600' : 'text-gray-300 dark:text-gray-600'}>▼</span>
        </span>
      </span>
    </th>
  );
}
