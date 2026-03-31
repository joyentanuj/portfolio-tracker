import { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { xirr, buildCashFlows } from '../utils/xirr';

export function useXIRR(transactions, currentValue) {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) return null;
    const flows = buildCashFlows(transactions, currentValue);
    if (!flows) return null;
    return xirr(flows);
  }, [transactions, currentValue]);
}

export function useCategoryXIRR(category) {
  const { getCategoryStats } = usePortfolio();
  return useMemo(() => getCategoryStats(category), [getCategoryStats, category]);
}

export function usePortfolioXIRR() {
  const { getPortfolioStats } = usePortfolio();
  return useMemo(() => getPortfolioStats(), [getPortfolioStats]);
}
