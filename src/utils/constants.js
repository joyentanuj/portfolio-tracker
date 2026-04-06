export const ASSET_CATEGORIES = {
  STOCKS: 'stocks',
  US_STOCKS: 'usStocks',
  MUTUAL_FUNDS: 'mutualFunds',
  FIXED_DEPOSITS: 'fixedDeposits',
  GOLD: 'gold',
  SILVER: 'silver',
  CASH: 'cash',
  REAL_ESTATE: 'realEstate',
  OTHERS: 'others',
};

export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
};

export const CATEGORY_COLORS = {
  stocks: '#6366f1',
  usStocks: '#3b82f6',
  mutualFunds: '#8b5cf6',
  fixedDeposits: '#06b6d4',
  gold: '#f59e0b',
  silver: '#94a3b8',
  cash: '#22c55e',
  realEstate: '#f97316',
  others: '#ec4899',
};

export const CATEGORY_LABELS = {
  stocks: 'Indian Stocks',
  usStocks: 'US Stocks',
  mutualFunds: 'Mutual Funds',
  fixedDeposits: 'Fixed Deposits',
  gold: 'Gold',
  silver: 'Silver',
  cash: 'Cash',
  realEstate: 'Real Estate',
  others: 'Others',
};

export const CATEGORY_ICONS = {
  stocks: '📈',
  usStocks: '🇺🇸',
  mutualFunds: '🏦',
  fixedDeposits: '🏛️',
  gold: '🥇',
  silver: '🥈',
  cash: '💵',
  realEstate: '🏠',
  others: '📦',
};

export const NAV_LINKS = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/stocks', label: 'Indian Stocks', icon: '📈' },
  { path: '/us-stocks', label: 'US Stocks', icon: '🇺🇸' },
  { path: '/mutual-funds', label: 'Mutual Funds', icon: '🏦' },
  { path: '/fixed-deposits', label: 'Fixed Deposits', icon: '🏛️' },
  { path: '/gold-silver', label: 'Gold & Silver', icon: '🥇' },
  { path: '/cash', label: 'Cash', icon: '💵' },
  { path: '/real-estate', label: 'Real Estate', icon: '🏠' },
  { path: '/others', label: 'Others', icon: '📦' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export const COMPOUNDING_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'halfYearly', label: 'Half Yearly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'simple', label: 'Simple Interest' },
];
