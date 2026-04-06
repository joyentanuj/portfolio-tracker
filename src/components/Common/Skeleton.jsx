import React from 'react';

export function SkeletonCard({ large = false }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
      <div className={`bg-gray-200 dark:bg-gray-700 rounded ${large ? 'h-8 w-36' : 'h-6 w-28'} mb-2`} />
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  const OPACITY_DECREMENT = 0.08;
  return (
    <div className="animate-pulse space-y-0">
      {/* Header */}
      <div className="flex gap-4 py-3 border-b border-gray-200 dark:border-gray-700 mb-1">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded flex-1"
              style={{ opacity: 1 - colIdx * OPACITY_DECREMENT }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700/60 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded w-1/2" />
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded w-12 ml-auto" />
      </div>
    </div>
  );
}
