import React, { useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { buildCorrelationMatrix, correlationLabel } from '../../utils/correlationCalculations';
import { CATEGORY_LABELS } from '../../utils/constants';

function seriesFromValue(base, seed) {
  return Array.from({ length: 30 }, (_, i) => {
    const drift = 1 + (Math.sin((i + seed) / 7) * 0.02) + ((seed % 3) * 0.003);
    return base * Math.pow(drift, i / 6);
  });
}

function bgFor(v) {
  const a = Math.min(1, Math.abs(v));
  if (v >= 0) return `rgba(16, 185, 129, ${0.15 + a * 0.55})`;
  return `rgba(239, 68, 68, ${0.15 + a * 0.55})`;
}

export default function CorrelationMatrix() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  const { keys, matrix } = useMemo(() => {
    const active = Object.entries(stats.categoryBreakdown)
      .filter(([, s]) => s.totalValue > 0)
      .slice(0, 6);
    const series = {};
    active.forEach(([cat, s], i) => {
      series[cat] = seriesFromValue(Math.max(1, s.totalValue), i + 1);
    });
    return { keys: Object.keys(series), matrix: buildCorrelationMatrix(series) };
  }, [stats]);

  if (!keys.length) return <p className="text-sm text-gray-500 dark:text-gray-400">Not enough data for correlation.</p>;

  return (
    <div className="space-y-3">
      <div className="grid" style={{ gridTemplateColumns: `120px repeat(${keys.length}, minmax(0,1fr))` }}>
        <div />
        {keys.map(k => <div key={`h-${k}`} className="text-[10px] text-center text-gray-500 dark:text-gray-400 px-1">{CATEGORY_LABELS[k]}</div>)}
        {matrix.map((row, rowIdx) => (
          <React.Fragment key={keys[rowIdx]}>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 py-1 pr-2">{CATEGORY_LABELS[keys[rowIdx]]}</div>
            {row.map(cell => (
              <div
                key={`${cell.row}-${cell.col}`}
                className="h-10 rounded-md m-0.5 flex items-center justify-center text-[10px] font-semibold text-gray-800"
                style={{ background: bgFor(cell.value) }}
                title={`${CATEGORY_LABELS[cell.row]} vs ${CATEGORY_LABELS[cell.col]}: ${cell.value.toFixed(2)} (${correlationLabel(cell.value)})`}
              >
                {cell.value.toFixed(2)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">Guide: Strong Positive (&gt;0.7), Strong Negative (&lt;-0.7), No Correlation (~0)</p>
    </div>
  );
}
