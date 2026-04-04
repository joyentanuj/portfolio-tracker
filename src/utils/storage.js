import { defaultStocks, defaultMutualFunds } from '../data/defaultHoldings';

const PORTFOLIO_KEY = 'portfolio_tracker_data';
// Increment DATA_VERSION whenever defaultHoldings.js changes so that all users
// automatically receive the corrected data on their next page load.
const DATA_VERSION = 2;
const VERSION_KEY = 'portfolio_tracker_data_version';

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getInitialData = () => ({
  stocks: [],
  mutualFunds: [],
  fixedDeposits: [],
  gold: [],
  silver: [],
  cash: [],
  realEstate: [],
  others: [],
  settings: { autoRefresh: true, refreshInterval: 60 },
});

function buildSeededData() {
  const data = getInitialData();
  const buyDate = '2024-01-01';

  data.stocks = defaultStocks.map((s) => ({
    id: generateId(),
    symbol: s.symbol,
    name: s.name,
    exchange: s.exchange,
    category: 'stocks',
    transactions: [
      {
        id: generateId(),
        type: 'buy',
        date: buyDate,
        quantity: s.qty,
        price: s.avgCost,
        amount: parseFloat((s.qty * s.avgCost).toFixed(2)),
        notes: 'Initial import',
      },
    ],
  }));

  data.mutualFunds = defaultMutualFunds.map((mf) => ({
    id: generateId(),
    schemeCode: mf.schemeCode,
    schemeName: mf.schemeName,
    category: 'mutualFunds',
    transactions: [
      {
        id: generateId(),
        type: 'buy',
        date: buyDate,
        quantity: mf.units,
        price: mf.avgCost,
        amount: parseFloat((mf.units * mf.avgCost).toFixed(2)),
        notes: 'Initial import',
      },
    ],
  }));

  return data;
}

export const getPortfolioData = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);

    if (!raw) {
      // First ever load — seed with default holdings
      const seeded = buildSeededData();
      try {
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(seeded));
        localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
      } catch (e) {
        console.error('Failed to save seeded portfolio data', e);
      }
      return seeded;
    }

    // Update version key without touching user data
    const currentVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
    if (currentVersion < DATA_VERSION) {
      try {
        localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
      } catch (e) {
        console.error('Failed to update version key', e);
      }
    }

    const parsed = JSON.parse(raw);
    // Merge with initial data to ensure all keys exist
    const initial = getInitialData();
    return { ...initial, ...parsed, settings: { ...initial.settings, ...(parsed.settings || {}) } };
  } catch {
    return getInitialData();
  }
};

export const savePortfolioData = (data) => {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save portfolio data', e);
  }
};

export const clearPortfolioData = () => {
  localStorage.removeItem(PORTFOLIO_KEY);
  localStorage.removeItem(VERSION_KEY);
};
