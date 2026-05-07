import React from 'react';

export default function RiskBadge({ risk }) {
  const cls = risk?.level === 'High'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : risk?.level === 'Medium'
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}
      title={`Risk score ${(risk?.score ?? 0).toFixed(2)} based on asset type, volatility proxy and concentration`}
    >
      {risk?.level || 'Low'} Risk
    </span>
  );
}
