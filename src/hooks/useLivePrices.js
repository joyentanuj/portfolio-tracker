import { useEffect, useCallback, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchMultipleStocks, fetchMultipleMFs, fetchGoldSilverPrice, fetchGoogleFinancePrice, fetchGoogleForexRate } from '../utils/priceService';

export function useLivePrices() {
  const { data, updatePrices } = usePortfolio();
  const fetchingRef = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const priceMap = {};

      // Indian Stocks
      const stockSymbols = (data.stocks || []).map(s => s.symbol).filter(Boolean);
      if (stockSymbols.length > 0) {
        const stockPrices = await fetchMultipleStocks(stockSymbols);
        for (const [sym, info] of Object.entries(stockPrices)) {
          priceMap[sym] = { price: info.price, change: info.change, changePercent: info.changePercent, previousClose: info.previousClose };
        }
      }

      // US Stocks (plain symbols, no .NS suffix)
      const usStockSymbols = (data.usStocks || []).map(s => s.symbol).filter(Boolean);
      if (usStockSymbols.length > 0) {
        const usPrices = await fetchMultipleStocks(usStockSymbols);
        for (const [sym, info] of Object.entries(usPrices)) {
          priceMap[sym] = { price: info.price, change: info.change, changePercent: info.changePercent, previousClose: info.previousClose, currency: 'USD' };
        }
      }

      // USD/INR exchange rate via Google Finance (with Yahoo Finance as fallback)
      const forexData = await fetchGoogleForexRate('USD', 'INR');
      if (forexData?.price) {
        priceMap['USDINR=X'] = { price: forexData.price, change: forexData.change, changePercent: forexData.changePercent, previousClose: forexData.previousClose, currency: 'INR' };
      }

      // Mutual Funds
      const mfCodes = (data.mutualFunds || []).map(mf => mf.schemeCode).filter(Boolean);
      if (mfCodes.length > 0) {
        const mfPrices = await fetchMultipleMFs(mfCodes);
        for (const [code, info] of Object.entries(mfPrices)) {
          priceMap[code] = { price: info.nav, nav: info.nav, change: info.change, changePercent: info.changePercent };
        }
      }

      // Gold & Silver commodity prices
      const gs = await fetchGoldSilverPrice();
      priceMap['gold'] = { price: gs.gold, source: gs.source };
      priceMap['silver'] = { price: gs.silver, source: gs.source };

      // Gold ETF prices (via Google Finance)
      const goldEtfs = (data.gold || []).filter(a => a.type === 'etf' && a.symbol);
      const silverEtfs = (data.silver || []).filter(a => a.type === 'etf' && a.symbol);
      const allEtfs = [...goldEtfs, ...silverEtfs];

      await Promise.allSettled(
        allEtfs.map(async (etf) => {
          const info = await fetchGoogleFinancePrice(etf.symbol);
          if (info) {
            priceMap[etf.symbol] = {
              price: info.price,
              change: info.change,
              changePercent: info.changePercent,
              previousClose: info.previousClose,
              source: info.source,
            };
          }
        })
      );

      updatePrices(priceMap);
    } catch (err) {
      console.error('Price fetch error:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, [data.stocks, data.usStocks, data.mutualFunds, data.gold, data.silver, updatePrices]);

  // Fetch on mount and whenever assets change
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh every 5 seconds (fast polling for near-live prices)
  useEffect(() => {
    if (!data.settings?.autoRefresh) return;
    const timer = setInterval(fetchPrices, 5000); // 5 second fast poll
    return () => clearInterval(timer);
  }, [fetchPrices, data.settings?.autoRefresh]);

  return { fetchPrices };
}
