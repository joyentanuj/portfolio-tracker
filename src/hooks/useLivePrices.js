import { useEffect, useCallback, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchMultipleStocks, fetchMultipleMFs, fetchGoldSilverPrice } from '../utils/priceService';

export function useLivePrices() {
  const { data, updatePrices } = usePortfolio();
  const fetchingRef = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const priceMap = {};

      // Stocks
      const stockSymbols = (data.stocks || []).map(s => s.symbol).filter(Boolean);
      if (stockSymbols.length > 0) {
        const stockPrices = await fetchMultipleStocks(stockSymbols);
        for (const [sym, info] of Object.entries(stockPrices)) {
          priceMap[sym] = { price: info.price, change: info.change, changePercent: info.changePercent, previousClose: info.previousClose };
        }
      }

      // Mutual Funds
      const mfCodes = (data.mutualFunds || []).map(mf => mf.schemeCode).filter(Boolean);
      if (mfCodes.length > 0) {
        const mfPrices = await fetchMultipleMFs(mfCodes);
        for (const [code, info] of Object.entries(mfPrices)) {
          priceMap[code] = { price: info.nav, nav: info.nav, change: info.change, changePercent: info.changePercent };
        }
      }

      // Gold & Silver
      const gs = await fetchGoldSilverPrice();
      priceMap['gold'] = { price: gs.gold, source: gs.source };
      priceMap['silver'] = { price: gs.silver, source: gs.source };

      updatePrices(priceMap);
    } catch (err) {
      console.error('Price fetch error:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, [data.stocks, data.mutualFunds, updatePrices]);

  // Fetch on mount and whenever assets change
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh
  useEffect(() => {
    if (!data.settings?.autoRefresh) return;
    const interval = (data.settings?.refreshInterval || 60) * 1000;
    const timer = setInterval(fetchPrices, interval);
    return () => clearInterval(timer);
  }, [fetchPrices, data.settings?.autoRefresh, data.settings?.refreshInterval]);

  return { fetchPrices };
}
