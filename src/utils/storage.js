import { defaultStocks, defaultMutualFunds } from '../data/defaultHoldings';

const PORTFOLIO_KEY = 'portfolio_tracker_data';
// Increment DATA_VERSION whenever defaultHoldings.js changes so that all users
// automatically receive the corrected data on their next page load.
const DATA_VERSION = 4;
const VERSION_KEY = 'portfolio_tracker_data_version';

// Maps old (wrong) scheme codes → new (correct) scheme codes introduced in each version.
// Only holdings whose schemeCode exactly matches an old code will be updated.
const SCHEME_CODE_MIGRATIONS = {
  // v3: Fix scheme codes that were returning wrong NAVs
  '120595': '120603', // ICICI Prudential All Seasons Bond Fund (was showing ₹114 instead of ~₹40.84)
  '149470': '127042', // Motilal Oswal Midcap Fund (was showing ₹1,279 instead of ~₹95.91)
  '147946': '148063', // Edelweiss US Technology Equity FoF (wrong fund was being fetched)
  '119598': '119800', // SBI Liquid Fund (was showing ₹94.86 instead of ~₹4,314)
  '146647': '120505', // Kotak Flexicap Fund (was showing ₹10.00 instead of ~₹88.62)
  '120503': '120465', // Axis Large Cap Fund (was returning ELSS NAV instead of Large Cap ~₹63.11)
  '120684': '145444', // ICICI Prudential Nifty Next 50 Index Fund (was showing wrong NAV instead of ~₹57.54)
};

// Maps symbol → corrected display name (v4: fix names to match brokerage)
const STOCK_NAME_MIGRATIONS = {
  'ABCAPITAL.NS':  'Aditya Birla Capital Ltd',
  'GOLDCASE.NS':   'Zerodha Gold ETF',
  'HDFCNEXT50.NS': 'HDFC Nifty NEXT 50 ETF',
  'KIRLOSENG.NS':  'Kirloskar Oil Engines Ltd',
  'LUMAXTECH.NS':  'Lumax AutoTechnologies Ltd',
  'NESTLEIND.NS':  'Nestle India Ltd',
  'NH.NS':         'Narayana Hrudayalaya Ltd',
  'SMALLCAP.NS':   'Mirae Asset Nifty Smallcap 250 Momentum Quality 100 ETF',
  'TMCV.NS':       'Tata Motors Ltd',
};

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

    // Version bump — apply targeted migrations so users automatically get
    // corrected scheme codes without losing any custom holdings they may have added.
    const currentVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
    if (currentVersion < DATA_VERSION) {
      try {
        const parsed = JSON.parse(raw);
        const initial = getInitialData();
        const data = { ...initial, ...parsed, settings: { ...initial.settings, ...(parsed.settings || {}) } };

        // Fix any mutual fund holdings that still use an old (wrong) scheme code.
        if (Array.isArray(data.mutualFunds)) {
          data.mutualFunds = data.mutualFunds.map((mf) => {
            const corrected = SCHEME_CODE_MIGRATIONS[mf.schemeCode];
            return corrected ? { ...mf, schemeCode: corrected } : mf;
          });
        }

        // Fix stock display names that were wrong.
        if (Array.isArray(data.stocks)) {
          data.stocks = data.stocks.map((stock) => {
            const correctedName = STOCK_NAME_MIGRATIONS[stock.symbol];
            return correctedName ? { ...stock, name: correctedName } : stock;
          });
        }

        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data));
        localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
        return data;
      } catch (e) {
        console.error('Failed to migrate portfolio data on version bump', e);
        localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
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
