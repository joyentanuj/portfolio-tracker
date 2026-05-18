import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getPortfolioData, savePortfolioData, generateId, getInitialData, getPortfoliosState, savePortfoliosState } from '../utils/storage';
import { xirr, buildCashFlows } from '../utils/xirr';

const PortfolioContext = createContext(null);

const PRICES_CACHE_KEY = 'portfolio_tracker_prices';
// Fallback USD/INR rate when live forex fetch hasn't completed yet (update periodically)
const FALLBACK_USD_INR_RATE = 85.0;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_DASHBOARD_WIDGETS = {
  allocation: true,
  categoryBreakdown: true,
  sectorBreakdown: true,
  topPerformers: true,
  investmentTimeline: true,
  performanceComparison: true,
  volatility: true,
  correlation: true,
  heatmap: true,
  recentTx: true,
  health: true,
  goals: true,
  rebalancing: true,
  upcomingMaturities: true,
  dividendSummary: true,
};

function getCachedPrices() {
  try {
    const raw = localStorage.getItem(PRICES_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const { portfolios: initialPortfolios, activePortfolioId: initialActivePortfolioId } = getPortfoliosState();

const initialState = {
  portfolios: initialPortfolios,
  activePortfolioId: initialActivePortfolioId,
  data: initialPortfolios.find((p) => p.id === initialActivePortfolioId)?.data || getPortfolioData(),
  prices: getCachedPrices(),
  lastUpdated: null,
  loading: false,
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_PORTFOLIOS':
      return { ...state, portfolios: action.payload };
    case 'SET_ACTIVE_PORTFOLIO': {
      const active = action.data || state.portfolios.find((p) => p.id === action.payload)?.data;
      return { ...state, activePortfolioId: action.payload, data: active || getInitialData() };
    }
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

function cloneData(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const persistPortfolios = useCallback((portfolios, activePortfolioId) => {
    dispatch({ type: 'SET_PORTFOLIOS', payload: portfolios });
    const activeData = portfolios.find((p) => p.id === activePortfolioId)?.data || getInitialData();
    dispatch({ type: 'SET_ACTIVE_PORTFOLIO', payload: activePortfolioId, data: activeData });
    savePortfoliosState(portfolios, activePortfolioId);
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = generateId();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type, duration } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration);
  }, []);

  const updateData = useCallback((newData) => {
    const now = Date.now();
    const updatedPortfolios = state.portfolios.map((portfolio) =>
      portfolio.id === state.activePortfolioId
        ? { ...portfolio, data: newData, lastModified: now }
        : portfolio
    );
    persistPortfolios(updatedPortfolios, state.activePortfolioId);
    savePortfolioData(newData);
  }, [state.portfolios, state.activePortfolioId, persistPortfolios]);

  const createPortfolio = useCallback((name) => {
    const trimmed = (name || '').trim() || `Portfolio ${state.portfolios.length + 1}`;
    const id = generateId();
    const now = Date.now();
    const portfolio = { id, name: trimmed, data: getInitialData(), createdAt: now, lastModified: now };
    persistPortfolios([...state.portfolios, portfolio], id);
    showToast('Portfolio created');
    return portfolio;
  }, [state.portfolios, persistPortfolios, showToast]);

  const renamePortfolio = useCallback((id, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    const updated = state.portfolios.map((portfolio) =>
      portfolio.id === id ? { ...portfolio, name: trimmed, lastModified: Date.now() } : portfolio
    );
    persistPortfolios(updated, state.activePortfolioId);
    showToast('Portfolio renamed');
  }, [state.portfolios, state.activePortfolioId, persistPortfolios, showToast]);

  const deletePortfolio = useCallback((id) => {
    if (state.portfolios.length <= 1) {
      showToast('At least one portfolio is required', 'error');
      return;
    }
    const remaining = state.portfolios.filter((portfolio) => portfolio.id !== id);
    const nextActiveId = state.activePortfolioId === id ? remaining[0].id : state.activePortfolioId;
    persistPortfolios(remaining, nextActiveId);
    showToast('Portfolio deleted');
  }, [state.portfolios, state.activePortfolioId, persistPortfolios, showToast]);

  const switchPortfolio = useCallback((id) => {
    const selected = state.portfolios.find((portfolio) => portfolio.id === id);
    if (!selected) return;
    persistPortfolios(state.portfolios, id);
  }, [state.portfolios, persistPortfolios]);

  const duplicatePortfolio = useCallback((id, newName) => {
    const source = state.portfolios.find((portfolio) => portfolio.id === id);
    if (!source) return null;
    const now = Date.now();
    const copy = {
      id: generateId(),
      name: (newName || '').trim() || `${source.name} Copy`,
      data: cloneData(source.data || getInitialData()),
      createdAt: now,
      lastModified: now,
    };
    persistPortfolios([...state.portfolios, copy], copy.id);
    showToast('Portfolio duplicated');
    return copy;
  }, [state.portfolios, persistPortfolios, showToast]);

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
          ? (() => {
            const existingTransactions = a.transactions || [];
            if (category !== 'epfo' || existingTransactions.length > 0) {
              return { ...a, transactions: [...existingTransactions, newTx] };
            }

            const legacyEmployee = Number(a.employeeContribution) || 0;
            const legacyEmployer = Number(a.employerContribution) || 0;
            const legacyTotal = legacyEmployee + legacyEmployer;
            const legacyInterest = Math.max(0, (Number(a.currentBalance) || 0) - legacyTotal);
            const migrationDate = a.dateOfJoining
              || (() => {
                const txTime = new Date(newTx.date).getTime();
                if (Number.isNaN(txTime)) return new Date().toISOString().split('T')[0];
                return new Date(txTime - MS_PER_DAY).toISOString().split('T')[0];
              })();
            const migrationTx = legacyTotal > 0 || legacyInterest > 0
              ? {
                id: generateId(),
                date: migrationDate,
                type: 'contribution',
                employeeAmount: legacyEmployee,
                employerAmount: legacyEmployer,
                vpfAmount: 0,
                interestEarned: legacyInterest,
                notes: 'Opening balance migration',
              }
              : null;

            return {
              ...a,
              transactions: migrationTx ? [migrationTx, newTx] : [newTx],
            };
          })()
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
          ? { ...a, transactions: (a.transactions || []).map(t => t.id === txId ? { ...t, ...updates } : t) }
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
          ? { ...a, transactions: (a.transactions || []).filter(t => t.id !== txId) }
          : a
      ),
    };
    updateData(newData);
    showToast('Transaction deleted');
  }, [state.data, updateData, showToast]);

  const addWatchlistItem = useCallback((item) => {
    const watchlistItem = {
      id: generateId(),
      addedAt: new Date().toISOString(),
      targetPrice: item.targetPrice ?? null,
      notes: item.notes || '',
      ...item,
    };
    updateData({ ...state.data, watchlist: [...(state.data.watchlist || []), watchlistItem] });
    showToast('Added to watchlist');
    return watchlistItem;
  }, [state.data, updateData, showToast]);

  const updateWatchlistItem = useCallback((id, updates) => {
    const watchlist = (state.data.watchlist || []).map((item) => (item.id === id ? { ...item, ...updates } : item));
    updateData({ ...state.data, watchlist });
  }, [state.data, updateData]);

  const deleteWatchlistItem = useCallback((id) => {
    const watchlist = (state.data.watchlist || []).filter((item) => item.id !== id);
    updateData({ ...state.data, watchlist });
    showToast('Removed from watchlist');
  }, [state.data, updateData, showToast]);

  const addAlert = useCallback((alert) => {
    const record = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      triggered: false,
      notified: false,
      ...alert,
    };
    updateData({ ...state.data, alerts: [...(state.data.alerts || []), record] });
    showToast('Alert created');
    return record;
  }, [state.data, updateData, showToast]);

  const updateAlert = useCallback((id, updates) => {
    const alerts = (state.data.alerts || []).map((alert) => (alert.id === id ? { ...alert, ...updates } : alert));
    updateData({ ...state.data, alerts });
  }, [state.data, updateData]);

  const deleteAlert = useCallback((id) => {
    const alerts = (state.data.alerts || []).filter((alert) => alert.id !== id);
    updateData({ ...state.data, alerts });
    showToast('Alert deleted');
  }, [state.data, updateData, showToast]);

  // ─── Price update ─────────────────────────────────────────────────────────

  const updatePrices = useCallback((priceMap) => {
    dispatch({ type: 'SET_PRICES', payload: priceMap });
    const mergedPrices = { ...state.prices, ...priceMap };
    const alerts = state.data.alerts || [];
    let changed = false;

    const nextAlerts = alerts.map((alert) => {
      if (alert.triggered) return alert;
      const symbol = alert.symbol || alert.assetSymbol;
      const priceInfo = symbol ? mergedPrices[symbol] : null;
      if (!priceInfo) return alert;
      const currentPrice = Number(priceInfo.price ?? priceInfo.nav);
      if (!Number.isFinite(currentPrice)) return alert;

      let shouldTrigger = false;
      if (alert.type === 'above') shouldTrigger = currentPrice >= Number(alert.targetPrice);
      else if (alert.type === 'below') shouldTrigger = currentPrice <= Number(alert.targetPrice);
      else if (alert.type === 'pctChange') shouldTrigger = Math.abs(Number(priceInfo.changePercent || 0)) >= Number(alert.targetPercent || 0);

      if (!shouldTrigger) return alert;
      changed = true;
      showToast(`${alert.assetName || symbol} alert triggered`, 'info');
      return {
        ...alert,
        currentPrice,
        triggered: true,
        notified: false,
        triggeredAt: new Date().toISOString(),
      };
    });

    if (changed) {
      updateData({ ...state.data, alerts: nextAlerts });
    }
  }, [state.prices, state.data, updateData, showToast]);

  const updateSettings = useCallback((settings) => {
    const newData = { ...state.data, settings: { ...state.data.settings, ...settings } };
    updateData(newData);
  }, [state.data, updateData]);

  const getDashboardWidgets = useCallback(() => {
    try {
      const raw = localStorage.getItem('dashboard_widgets');
      if (!raw) return DEFAULT_DASHBOARD_WIDGETS;
      return { ...DEFAULT_DASHBOARD_WIDGETS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_DASHBOARD_WIDGETS;
    }
  }, []);

  const saveDashboardWidgets = useCallback((widgets) => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
  }, []);

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
      const transactions = asset.transactions || [];
      const hasTransactions = transactions.length > 0;
      const employeeContributionTotal = hasTransactions
        ? transactions.reduce((sum, tx) => sum + (Number(tx.employeeAmount) || 0), 0)
        : (Number(asset.employeeContribution) || 0);
      const employerContributionTotal = hasTransactions
        ? transactions.reduce((sum, tx) => sum + (Number(tx.employerAmount) || 0), 0)
        : (Number(asset.employerContribution) || 0);
      const vpfTotal = hasTransactions
        ? transactions.reduce((sum, tx) => sum + (Number(tx.vpfAmount) || 0), 0)
        : 0;
      const investedValue = employeeContributionTotal + employerContributionTotal + vpfTotal;
      const totalInterest = hasTransactions
        ? transactions.reduce((sum, tx) => sum + (Number(tx.interestEarned) || 0), 0)
        : Math.max(0, (Number(asset.currentBalance) || 0) - investedValue);
      const currentValue = hasTransactions ? investedValue + totalInterest : (asset.currentBalance || 0);
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? pnl / investedValue : 0;
      return {
        currentValue,
        investedValue,
        pnl,
        pnlPercent,
        xirr: null,
        employeeContributionTotal,
        employerContributionTotal,
        vpfTotal,
        totalInterest,
      };
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
    portfolios: state.portfolios,
    activePortfolioId: state.activePortfolioId,
    activePortfolioName: state.portfolios.find((p) => p.id === state.activePortfolioId)?.name || 'My Portfolio',
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
    addWatchlistItem,
    updateWatchlistItem,
    deleteWatchlistItem,
    addAlert,
    updateAlert,
    deleteAlert,
    // Portfolio management
    createPortfolio,
    renamePortfolio,
    deletePortfolio,
    switchPortfolio,
    duplicatePortfolio,
    // Prices
    updatePrices,
    // Settings
    updateSettings,
    getDashboardWidgets,
    saveDashboardWidgets,
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
