import React from 'react';

export default function StatCard({ label, value, sub, color = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-bold text-xl ${color}`}>{value}</p>
      {sub && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}
