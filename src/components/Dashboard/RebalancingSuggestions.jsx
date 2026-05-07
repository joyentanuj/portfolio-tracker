import React, { useMemo } from 'react';
import { Scale, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { formatCurrencyCompact } from '../../utils/formatters';

// Sample target allocation model (balanced portfolio). These can be made configurable in settings.
const IDEAL_ALLOCATION = {
  stocks: 35,
  mutualFunds: 25,
  usStocks: 10,
  gold: 10,
  fixedDeposits: 10,
  cash: 5,
  others: 5,
};

export default function RebalancingSuggestions() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  const suggestions = useMemo(() => {
    const { categoryBreakdown, totalValue } = stats;
    if (totalValue === 0) return [];

    return Object.entries(IDEAL_ALLOCATION)
      .map(([cat, idealPct]) => {
        const catStats = categoryBreakdown[cat];
        const actualValue = catStats?.totalValue ?? 0;
        const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0;
        const diff = actualPct - idealPct;
        const idealValue = (idealPct / 100) * totalValue;
        const adjustment = idealValue - actualValue;

        return { cat, actualPct, idealPct, diff, actualValue, adjustment };
      })
      .filter(s => s.actualValue > 0 || s.idealPct > 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 5);
  }, [stats]);

  if (stats.totalValue === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm gap-2">
        <Scale className="w-8 h-8" />
        <p>Add assets to see rebalancing suggestions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Based on a balanced portfolio model. Actual vs ideal allocation:
      </p>
      {suggestions.map(({ cat, actualPct, idealPct, diff, adjustment }) => {
        const isOver = diff > 2;
        const isUnder = diff < -2;
        const isBalanced = !isOver && !isUnder;
        const color = CATEGORY_COLORS[cat];

        return (
          <div key={cat} className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs"
              style={{ background: color + '22' }}
            >
              {CATEGORY_ICONS[cat]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{CATEGORY_LABELS[cat]}</span>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                  isOver ? 'text-amber-600' : isUnder ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {isOver ? <ArrowUp className="w-2.5 h-2.5" /> : isUnder ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                  {actualPct.toFixed(1)}% / {idealPct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(actualPct, 100)}%`, background: color }}
                />
              </div>
              {!isBalanced && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {isOver
                    ? `Reduce by ${formatCurrencyCompact(Math.abs(adjustment))}`
                    : `Add ${formatCurrencyCompact(Math.abs(adjustment))}`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
