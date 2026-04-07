import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getPortfolioData, savePortfolioData, generateId } from '../utils/storage';
import { xirr, buildCashFlows } from '../utils/xirr';

const PortfolioContext = createContext(null);

const PRICES_CACHE_KEY = 'portfolio_tracker_prices';
// Fallback USD/INR rate when live forex fetch hasn't completed yet (update periodically)
const FALLBACK_USD_INR_RATE = 85.0;

function getCachedPrices() {
  try {
    const raw = localStorage.getItem(PRICES_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const initialState = {
  data: getPortfolioData(),
  prices: getCachedPrices(),
  lastUpdated: null,
  loading: false,
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_PRICES': {
      const newPrices = { ...state.prices, ...action.payload };
      try {
        localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify(newPrices));
      } catch (e) {
        console.error('Failed to cache prices', e);
      }
      return { ...state, prices: newPrices, lastUpdated: new Date() };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: generateId(), ...action.payload }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function calcHoldings(transactions = []) {
  let totalUnits = 0;
  let totalBuyAmount = 0;
  let totalBuyUnits = 0;
  for (const t of transactions) {
    if (t.type === 'buy') {
      totalUnits += Number(t.quantity);
      totalBuyUnits += Number(t.quantity);
      totalBuyAmount += Number(t.amount);
    } else if (t.type === 'sell') {
      totalUnits -= Number(t.quantity);
    }
  }
  const avgBuyPrice = totalBuyUnits > 0 ? totalBuyAmount / totalBuyUnits : 0;
  return { totalUnits: Math.max(0, totalUnits), avgBuyPrice, totalBuyAmount };
}

function calcFDValue(fd) {
  const { principal, interestRate, startDate, maturityDate, compoundingFrequency } = fd;
  if (!principal || !interestRate || !startDate) return principal || 0;

  const start = new Date(startDate);
  const end = maturityDate ? new Date(maturityDate) : new Date();
  const now = new Date();
  const endDate = end < now ? end : now;
  const years = Math.max(0, (endDate - start) / (365.25 * 24 * 60 * 60 * 1000));
  const rate = interestRate / 100;

  if (compoundingFrequency === 'simple') {
    return principal * (1 + rate * years);
  }
  const n = compoundingFrequency === 'monthly' ? 12
    : compoundingFrequency === 'quarterly' ? 4
    : compoundingFrequency === 'halfYearly' ? 2
    : 1;
  return principal * Math.pow(1 + rate / n, n * years);
}

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const showToast = useCallback((message, type = 'success') => {
    const id = generateId();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, []);

  const updateData = useCallback((newData) => {
    dispatch({ type: 'SET_DATA', payload: newData });
    savePortfolioData(newData);
  }, []);

  // ─── Asset CRUD ───────────────────────────────────────────────────────────

  const addAsset = useCallback((category, asset) => {
    const newAsset = { ...asset, id: generateId(), transactions: asset.transactions || [] };
    const newData = { ...state.data, [category]: [...(state.data[category] || []), newAsset] };
    updateData(newData);
    showToast('Asset added successfully');
    return newAsset;
  }, [state.data, updateData, showToast]);

  const updateAsset = useCallback((category, assetId, updates) => {
    const newData = {
      ...state.data,
      [category]: state.data[category].map(a => a.id === assetId ? { ...a, ...updates } : a),
    };
    updateData(newData);
    showToast('Asset updated');
  }, [state.data, updateData, showToast]);

  const deleteAsset = useCallback((category, assetId) => {
    const newData = {
      ...state.data,
      [category]: state.data[category].filter(a => a.id !== assetId),
    };
    updateData(newData);
    showToast('Asset deleted');
  }, [state.data, updateData, showToast]);

  // ─── Transaction CRUD ─────────────────────────────────────────────────────

  const addTransaction = useCallback((category, assetId, transaction) => {
    const newTx = { ...transaction, id: generateId() };
    const newData = {
      ...state.data,
      [category]: state.data[category].map(a =>
        a.id === assetId
          ? { ...a, transactions: [...(a.transactions || []), newTx] }
          : a
      ),
    };
    updateData(newData);
    showToast('Transaction added');
  }, [state.data, updateData, showToast]);

  const updateTransaction = useCallback((category, assetId, txId, updates) => {
    const newData = {
      ...state.data,
      [category]: state.data[category].map(a =>
        a.id === assetId
          ? { ...a, transactions: a.transactions.map(t => t.id === txId ? { ...t, ...updates } : t) }
          : a
      ),
    };
    updateData(newData);
    showToast('Transaction updated');
  }, [state.data, updateData, showToast]);

  const deleteTransaction = useCallback((category, assetId, txId) => {
    const newData = {
      ...state.data,
      [category]: state.data[category].map(a =>
        a.id === assetId
          ? { ...a, transactions: a.transactions.filter(t => t.id !== txId) }
          : a
      ),
    };
    updateData(newData);
    showToast('Transaction deleted');
  }, [state.data, updateData, showToast]);

  // ─── Price update ─────────────────────────────────────────────────────────

  const updatePrices = useCallback((priceMap) => {
    dispatch({ type: 'SET_PRICES', payload: priceMap });
  }, []);

  const updateSettings = useCallback((settings) => {
    const newData = { ...state.data, settings: { ...state.data.settings, ...settings } };
    updateData(newData);
  }, [state.data, updateData]);

  // ─── Computed portfolio stats ─────────────────────────────────────────────

  const getAssetStats = useCallback((asset, category) => {
    if (['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'].includes(category)) {
      const { totalUnits, avgBuyPrice, totalBuyAmount } = calcHoldings(asset.transactions);
      const priceKey = (category === 'stocks' || category === 'usStocks') ? asset.symbol
        : category === 'mutualFunds' ? asset.schemeCode
        : (asset.type === 'etf' && asset.symbol) ? asset.symbol // ETF in gold/silver section
        : category; // 'gold' or 'silver'
      const livePrice = (category === 'gold' || category === 'silver') && asset.type !== 'etf'
        ? state.prices[category]?.price
        : state.prices[priceKey]?.price ?? state.prices[priceKey]?.nav;

      const currentPrice = livePrice || avgBuyPrice;
      const currentValue = totalUnits * currentPrice;
      const investedValue = totalUnits * avgBuyPrice;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;

      const cashFlows = buildCashFlows(asset.transactions, currentValue);
      const xirrVal = xirr(cashFlows);

      return { totalUnits, avgBuyPrice, currentPrice, currentValue, investedValue, pnl, pnlPercent, xirr: xirrVal, totalBuyAmount };
    }

    if (category === 'fixedDeposits') {
      const currentValue = calcFDValue(asset);
      const investedValue = asset.principal || 0;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;

      const startTs = new Date(asset.startDate).getTime();
      const endTs = asset.maturityDate ? new Date(asset.maturityDate).getTime() : Date.now();
      const yearsHeld = (endTs - startTs) / (365.25 * 24 * 60 * 60 * 1000);
      // Approximate XIRR for FD
      const xirrVal = yearsHeld > 0 ? Math.pow(currentValue / investedValue, 1 / yearsHeld) - 1 : null;
      return { currentValue, investedValue, pnl, pnlPercent, xirr: xirrVal };
    }

    if (category === 'ppf') {
      const currentValue = asset.currentBalance || 0;
      const investedValue = (asset.annualContributions || []).reduce((s, c) => s + Number(c.amount || 0), 0);
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;
      return { currentValue, investedValue, pnl, pnlPercent, xirr: null };
    }

    if (category === 'epfo') {
      const currentValue = asset.currentBalance || 0;
      const investedValue = (Number(asset.employeeContribution) || 0) + (Number(asset.employerContribution) || 0);
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;
      return { currentValue, investedValue, pnl, pnlPercent, xirr: null };
    }

    if (category === 'cash') {
      return { currentValue: asset.amount || 0, investedValue: asset.amount || 0, pnl: 0, pnlPercent: 0, xirr: null };
    }

    if (category === 'realEstate') {
      const currentValue = asset.currentValue || asset.purchasePrice || 0;
      const investedValue = asset.purchasePrice || 0;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;

      const startTs = asset.purchaseDate ? new Date(asset.purchaseDate).getTime() : Date.now();
      const yearsHeld = (Date.now() - startTs) / (365.25 * 24 * 60 * 60 * 1000);
      const xirrVal = yearsHeld > 0 && investedValue > 0 ? Math.pow(currentValue / investedValue, 1 / yearsHeld) - 1 : null;
      return { currentValue, investedValue, pnl, pnlPercent, xirr: xirrVal };
    }

    if (category === 'others') {
      const currentValue = asset.currentValue || asset.purchasePrice || 0;
      const investedValue = asset.purchasePrice || 0;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;
      return { currentValue, investedValue, pnl, pnlPercent, xirr: null };
    }

    return { currentValue: 0, investedValue: 0, pnl: 0, pnlPercent: 0, xirr: null };
  }, [state.prices]);

  const getCategoryStats = useCallback((category) => {
    const assets = state.data[category] || [];
    let totalValue = 0, totalInvested = 0;
    const allCashFlows = [];

    for (const asset of assets) {
      const stats = getAssetStats(asset, category);
      totalValue += stats.currentValue || 0;
      totalInvested += stats.investedValue || 0;

      if (['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'].includes(category) && asset.transactions) {
        const flows = buildCashFlows(asset.transactions, stats.currentValue);
        if (flows) allCashFlows.push(...flows);
      }
    }

    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? pnl / totalInvested : 0;

    let xirrVal = null;
    if (allCashFlows.length >= 2) {
      allCashFlows.sort((a, b) => new Date(a.date) - new Date(b.date));
      xirrVal = xirr(allCashFlows);
    }

    return { totalValue, totalInvested, pnl, pnlPercent, xirr: xirrVal, count: assets.length };
  }, [state.data, getAssetStats]);

  const getPortfolioStats = useCallback(() => {
    const categories = ['stocks', 'usStocks', 'mutualFunds', 'fixedDeposits', 'ppf', 'epfo', 'gold', 'silver', 'cash', 'realEstate', 'others'];
    const usdInrRate = state.prices['USDINR=X']?.price || FALLBACK_USD_INR_RATE;
    let totalValue = 0, totalInvested = 0;
    const allCashFlows = [];
    const categoryBreakdown = {};

    for (const cat of categories) {
      const stats = getCategoryStats(cat);
      const isUSD = cat === 'usStocks';
      const fxRate = isUSD ? usdInrRate : 1;
      totalValue += stats.totalValue * fxRate;
      totalInvested += stats.totalInvested * fxRate;
      categoryBreakdown[cat] = isUSD ? {
        ...stats,
        totalValue: stats.totalValue * fxRate,
        totalInvested: stats.totalInvested * fxRate,
        pnl: (stats.totalValue - stats.totalInvested) * fxRate,
      } : stats;

      if (['stocks', 'usStocks', 'mutualFunds', 'gold', 'silver'].includes(cat)) {
        for (const asset of (state.data[cat] || [])) {
          const aStats = getAssetStats(asset, cat);
          const flows = buildCashFlows(asset.transactions, aStats.currentValue * fxRate);
          if (flows) allCashFlows.push(...flows);
        }
      }
    }

    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? pnl / totalInvested : 0;

    let overallXirr = null;
    if (allCashFlows.length >= 2) {
      allCashFlows.sort((a, b) => new Date(a.date) - new Date(b.date));
      overallXirr = xirr(allCashFlows);
    }

    return { totalValue, totalInvested, pnl, pnlPercent, xirr: overallXirr, categoryBreakdown };
  }, [state.data, state.prices, getCategoryStats, getAssetStats]);

  const getDailyChange = useCallback(() => {
    let todayPnl = 0;
    const usdInrRate = state.prices['USDINR=X']?.price || FALLBACK_USD_INR_RATE;

    // Indian Stocks
    for (const asset of (state.data.stocks || [])) {
      const { totalUnits } = calcHoldings(asset.transactions);
      const priceData = state.prices[asset.symbol];
      if (priceData?.change) {
        todayPnl += totalUnits * priceData.change;
      }
    }

    // US Stocks (convert to INR)
    for (const asset of (state.data.usStocks || [])) {
      const { totalUnits } = calcHoldings(asset.transactions);
      const priceData = state.prices[asset.symbol];
      if (priceData?.change) {
        todayPnl += totalUnits * priceData.change * usdInrRate;
      }
    }

    // Mutual Funds
    for (const asset of (state.data.mutualFunds || [])) {
      const { totalUnits } = calcHoldings(asset.transactions);
      const priceData = state.prices[asset.schemeCode];
      if (priceData?.change) {
        todayPnl += totalUnits * priceData.change;
      }
    }

    // Gold ETFs
    for (const asset of (state.data.gold || [])) {
      if (asset.type !== 'etf' || !asset.symbol) continue;
      const { totalUnits } = calcHoldings(asset.transactions);
      const priceData = state.prices[asset.symbol];
      if (priceData?.change) {
        todayPnl += totalUnits * priceData.change;
      }
    }

    // Silver ETFs
    for (const asset of (state.data.silver || [])) {
      if (asset.type !== 'etf' || !asset.symbol) continue;
      const { totalUnits } = calcHoldings(asset.transactions);
      const priceData = state.prices[asset.symbol];
      if (priceData?.change) {
        todayPnl += totalUnits * priceData.change;
      }
    }

    return todayPnl;
  }, [state.data, state.prices]);

  const getCategoryDailyChange = useCallback((category) => {
    let todayPnl = 0;
    const usdInrRate = state.prices['USDINR=X']?.price || FALLBACK_USD_INR_RATE;

    if (category === 'stocks') {
      for (const asset of (state.data.stocks || [])) {
        const { totalUnits } = calcHoldings(asset.transactions);
        const priceData = state.prices[asset.symbol];
        if (priceData?.change) todayPnl += totalUnits * priceData.change;
      }
    } else if (category === 'usStocks') {
      for (const asset of (state.data.usStocks || [])) {
        const { totalUnits } = calcHoldings(asset.transactions);
        const priceData = state.prices[asset.symbol];
        if (priceData?.change) todayPnl += totalUnits * priceData.change * usdInrRate;
      }
    } else if (category === 'mutualFunds') {
      for (const asset of (state.data.mutualFunds || [])) {
        const { totalUnits } = calcHoldings(asset.transactions);
        const priceData = state.prices[asset.schemeCode];
        if (priceData?.change) todayPnl += totalUnits * priceData.change;
      }
    } else if (category === 'gold') {
      for (const asset of (state.data.gold || [])) {
        if (asset.type !== 'etf' || !asset.symbol) continue;
        const { totalUnits } = calcHoldings(asset.transactions);
        const priceData = state.prices[asset.symbol];
        if (priceData?.change) todayPnl += totalUnits * priceData.change;
      }
    } else if (category === 'silver') {
      for (const asset of (state.data.silver || [])) {
        if (asset.type !== 'etf' || !asset.symbol) continue;
        const { totalUnits } = calcHoldings(asset.transactions);
        const priceData = state.prices[asset.symbol];
        if (priceData?.change) todayPnl += totalUnits * priceData.change;
      }
    }

    return todayPnl;
  }, [state.data, state.prices]);

  const value = {
    data: state.data,
    prices: state.prices,
    lastUpdated: state.lastUpdated,
    loading: state.loading,
    toasts: state.toasts,
    // CRUD
    addAsset,
    updateAsset,
    deleteAsset,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // Prices
    updatePrices,
    // Settings
    updateSettings,
    updateData,
    // Stats
    getAssetStats,
    getCategoryStats,
    getPortfolioStats,
    getDailyChange,
    getCategoryDailyChange,
    // UI
    showToast,
    dispatch,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
};
