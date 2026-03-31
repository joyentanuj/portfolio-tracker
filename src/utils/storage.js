const PORTFOLIO_KEY = 'portfolio_tracker_data';

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

export const getPortfolioData = () => {
  try {
    const data = localStorage.getItem(PORTFOLIO_KEY);
    if (!data) return getInitialData();
    const parsed = JSON.parse(data);
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
};

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
