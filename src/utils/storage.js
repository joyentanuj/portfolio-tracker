import { defaultStocks, defaultMutualFunds, defaultGold, defaultGoldETFs, defaultSilverETFs } from '../data/defaultHoldings';

const PORTFOLIO_KEY = 'portfolio_tracker_data';
// Increment DATA_VERSION whenever defaultHoldings.js changes so that all users
// automatically receive the corrected data on their next page load.
const DATA_VERSION = 9;
const VERSION_KEY = 'portfolio_tracker_data_version';

// Maps old (wrong) scheme codes → new (correct) scheme codes introduced in each version.
// Only holdings whose schemeCode exactly matches an old code will be updated.
const SCHEME_CODE_MIGRATIONS = {
  // v3: Fix scheme codes that were returning wrong NAVs
  '120595': '120603', // ICICI Prudential All Seasons Bond Fund (was showing ₹114 instead of ~₹40.84)
  '149470': '127042', // Motilal Oswal Midcap Fund (was showing ₹1,279 instead of ~₹95.91)
  '147946': '148063', // Edelweiss US Technology Equity FoF (wrong fund was being fetched)
  '119598': '119800', // SBI Liquid Fund (was showing ₹94.86 instead of ~₹4,314)
  '120503': '120465', // Axis Large Cap Fund (was returning ELSS NAV instead of Large Cap ~₹63.11)
  // v5: Fix remaining wrong codes (undoing v3 mistakes and fixing newly identified issues)
  '146647': '120166', // Kotak Flexicap Fund: very old wrong code → correct Direct Growth code (intentionally same destination as next entry)
  '120505': '120166', // Kotak Flexicap Fund: v3's wrong destination code → correct Direct Growth code
  '145444': '120684', // ICICI Pru Nifty Next 50: revert bad v3 migration (145444 is Bharat Consumption IDCW!); also fixes users who had the correct 120684 before v3 incorrectly migrated them to 145444
  '147762': '149039', // Navi Nifty 50 Index Fund: was pointing to wrong fund (NAV ₹12.04 vs ₹14.89)
  '148466': '149910', // Navi NASDAQ 100 FoF: was pointing to ICICI Pru Nifty IT ETF!
  '128102': '118551', // Franklin US Opportunities: code 128102 returned wrong fund's NAV
  // v7: Fix Mirae Asset Nifty Smallcap 250 ETF FoF (150705 was Regular Plan; correct Direct Plan is 152459)
  '150705': '152459',
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

// Maps scheme code → corrected { units, avgCost } sourced from CAS (v6).
// Only the seeded 'Initial import' transaction is corrected; custom user transactions are left as-is.
const MF_DATA_MIGRATIONS = {
  '120465': { units: 1173.943, avgCost: 58.78 },   // Axis Large Cap Fund
  '148063': { units: 3407.564, avgCost: 29.93 },   // Edelweiss US Technology Equity FoF
  '118551': { units: 101.906,  avgCost: 49.07 },   // Franklin US Opportunities Equity
  '148473': { units: 12873.422, avgCost: 10.80 },  // ICICI Pru Nifty50 Value 20
  '120603': { units: 7476.554, avgCost: 40.12 },   // ICICI Pru All Seasons Bond
  '120684': { units: 2782.509, avgCost: 61.74 },   // ICICI Pru Nifty Next 50
  '120166': { units: 924.936,  avgCost: 74.60 },   // Kotak Flexicap Fund
  '118834': { units: 222.004,  avgCost: 103.60 },  // Mirae Asset Large & Midcap
  '152459': { units: 14491.170, avgCost: 9.80 },   // Mirae Smallcap 250 ETF FoF (Direct Plan)
  '127042': { units: 1644.486, avgCost: 112.49 },  // Motilal Oswal Midcap
  '149039': { units: 20781.077, avgCost: 15.62 },  // Navi Nifty 50
  '149910': { units: 1332.603, avgCost: 12.76 },   // Navi Nasdaq100 (was 2371 — major error)
  '122639': { units: 3647.148, avgCost: 86.59 },   // Parag Parikh Flexi Cap (combined folios)
  '120828': { units: 896.677,  avgCost: 273.89 },  // Quant Small Cap Fund
  '119800': { units: 23.769,   avgCost: 4207.23 }, // SBI Liquid Fund
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

  data.gold = defaultGold.map((g) => ({
    id: generateId(),
    name: g.name,
    type: g.type,
    category: 'gold',
    transactions: [
      {
        id: generateId(),
        type: 'buy',
        date: buyDate,
        quantity: g.grams,
        price: g.avgCost,
        amount: parseFloat((g.grams * g.avgCost).toFixed(2)),
        notes: 'Initial import',
      },
    ],
  }));

  defaultGoldETFs.forEach((etf) => {
    data.gold.push({
      id: generateId(),
      name: etf.name,
      symbol: etf.symbol,
      type: 'etf',
      category: 'gold',
      transactions: [
        {
          id: generateId(),
          type: 'buy',
          date: buyDate,
          quantity: etf.qty,
          price: etf.avgCost,
          amount: parseFloat((etf.qty * etf.avgCost).toFixed(2)),
          notes: 'Initial import',
        },
      ],
    });
  });

  defaultSilverETFs.forEach((etf) => {
    data.silver.push({
      id: generateId(),
      name: etf.name,
      symbol: etf.symbol,
      type: 'etf',
      category: 'silver',
      transactions: [
        {
          id: generateId(),
          type: 'buy',
          date: buyDate,
          quantity: etf.qty,
          price: etf.avgCost,
          amount: parseFloat((etf.qty * etf.avgCost).toFixed(2)),
          notes: 'Initial import',
        },
      ],
    });
  });

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
            let updated = mf;
            const correctedCode = SCHEME_CODE_MIGRATIONS[mf.schemeCode];
            if (correctedCode) {
              updated = { ...updated, schemeCode: correctedCode };
            }
            // Correct units/avgCost for the seeded 'Initial import' transaction (v6).
            const codeToCheck = correctedCode || mf.schemeCode;
            const dataFix = MF_DATA_MIGRATIONS[codeToCheck];
            if (dataFix && Array.isArray(updated.transactions)) {
              updated = {
                ...updated,
                transactions: updated.transactions.map((tx) => {
                  if (tx.notes === 'Initial import') {
                    return {
                      ...tx,
                      quantity: dataFix.units,
                      price: dataFix.avgCost,
                      amount: parseFloat((dataFix.units * dataFix.avgCost).toFixed(2)),
                    };
                  }
                  return tx;
                }),
              };
            }
            return updated;
          });
        }

        // Fix stock display names that were wrong.
        if (Array.isArray(data.stocks)) {
          data.stocks = data.stocks.map((stock) => {
            const correctedName = STOCK_NAME_MIGRATIONS[stock.symbol];
            return correctedName ? { ...stock, name: correctedName } : stock;
          });
        }

        // v9: Move gold/silver ETFs from stocks to their respective sections.
        const ETF_TO_GOLD = { 'GOLDBEES.NS': 'GOLDBEES', 'GOLDCASE.NS': 'GOLDCASE' };
        const ETF_TO_SILVER = { 'SILVERIETF.NS': 'SILVERIETF' };
        const buyDate = '2024-01-01';

        if (Array.isArray(data.stocks)) {
          const remainingStocks = [];
          for (const stock of data.stocks) {
            if (ETF_TO_GOLD[stock.symbol]) {
              // Move to gold section as ETF
              const cleanSymbol = ETF_TO_GOLD[stock.symbol];
              const alreadyInGold = (data.gold || []).some(
                (g) => g.type === 'etf' && g.symbol === cleanSymbol
              );
              if (!alreadyInGold) {
                data.gold = data.gold || [];
                data.gold.push({
                  ...stock,
                  id: stock.id || generateId(),
                  symbol: cleanSymbol,
                  type: 'etf',
                  category: 'gold',
                });
              }
            } else if (ETF_TO_SILVER[stock.symbol]) {
              // Move to silver section as ETF
              const cleanSymbol = ETF_TO_SILVER[stock.symbol];
              const alreadyInSilver = (data.silver || []).some(
                (s) => s.type === 'etf' && s.symbol === cleanSymbol
              );
              if (!alreadyInSilver) {
                data.silver = data.silver || [];
                data.silver.push({
                  ...stock,
                  id: stock.id || generateId(),
                  symbol: cleanSymbol,
                  type: 'etf',
                  category: 'silver',
                });
              }
            } else {
              remainingStocks.push(stock);
            }
          }
          data.stocks = remainingStocks;
        }

        // v9: Seed default gold holdings for users who have none yet (physical/SGB).
        const hasPhysicalGold = (data.gold || []).some((g) => g.type !== 'etf');
        if (!hasPhysicalGold) {
          data.gold = data.gold || [];
          data.gold.unshift(
            ...defaultGold.map((g) => ({
              id: generateId(),
              name: g.name,
              type: g.type,
              category: 'gold',
              transactions: [
                {
                  id: generateId(),
                  type: 'buy',
                  date: buyDate,
                  quantity: g.grams,
                  price: g.avgCost,
                  amount: parseFloat((g.grams * g.avgCost).toFixed(2)),
                  notes: 'Initial import',
                },
              ],
            }))
          );
        }

        // Seed gold ETFs if missing.
        for (const etf of defaultGoldETFs) {
          const exists = (data.gold || []).some((g) => g.type === 'etf' && g.symbol === etf.symbol);
          if (!exists) {
            data.gold = data.gold || [];
            data.gold.push({
              id: generateId(),
              name: etf.name,
              symbol: etf.symbol,
              type: 'etf',
              category: 'gold',
              transactions: [
                {
                  id: generateId(),
                  type: 'buy',
                  date: buyDate,
                  quantity: etf.qty,
                  price: etf.avgCost,
                  amount: parseFloat((etf.qty * etf.avgCost).toFixed(2)),
                  notes: 'Initial import',
                },
              ],
            });
          }
        }

        // Seed silver ETFs if missing.
        for (const etf of defaultSilverETFs) {
          const exists = (data.silver || []).some((s) => s.type === 'etf' && s.symbol === etf.symbol);
          if (!exists) {
            data.silver = data.silver || [];
            data.silver.push({
              id: generateId(),
              name: etf.name,
              symbol: etf.symbol,
              type: 'etf',
              category: 'silver',
              transactions: [
                {
                  id: generateId(),
                  type: 'buy',
                  date: buyDate,
                  quantity: etf.qty,
                  price: etf.avgCost,
                  amount: parseFloat((etf.qty * etf.avgCost).toFixed(2)),
                  notes: 'Initial import',
                },
              ],
            });
          }
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
