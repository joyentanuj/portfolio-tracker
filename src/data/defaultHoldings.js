// Default holdings data to pre-populate the portfolio on first load.
// Stocks use the .NS suffix for Yahoo Finance (NSE-listed).
// Mutual fund scheme codes are from mfapi.in — verify/update via the Edit button if needed.

export const defaultStocks = [
  { symbol: 'ABCAPITAL.NS',   name: 'Aditya Birla Capital Ltd',        exchange: 'NSE', qty: 514,   avgCost: 226.59  },
  { symbol: 'ADANIPORTS.NS',  name: 'Adani Ports & SEZ',               exchange: 'NSE', qty: 115,   avgCost: 1415.08 },
  { symbol: 'ADANIPOWER.NS',  name: 'Adani Power',                     exchange: 'NSE', qty: 600,   avgCost: 56.14   },
  { symbol: 'AIAENG.NS',      name: 'AIA Engineering',                 exchange: 'NSE', qty: 43,    avgCost: 3896.99 },
  { symbol: 'BANKINDIA.NS',   name: 'Bank of India',                   exchange: 'NSE', qty: 1220,  avgCost: 122.72  },
  { symbol: 'BEL.NS',         name: 'Bharat Electronics',              exchange: 'NSE', qty: 52,    avgCost: 385.75  },
  { symbol: 'BHARTIHEXA.NS',  name: 'Bharti Hexacom',                  exchange: 'NSE', qty: 14,    avgCost: 1785.34 },
  { symbol: 'CANBK.NS',       name: 'Canara Bank',                     exchange: 'NSE', qty: 1218,  avgCost: 149.11  },
  { symbol: 'COROMANDEL.NS',  name: 'Coromandel International',        exchange: 'NSE', qty: 11,    avgCost: 1816.54 },
  { symbol: 'ENDURANCE.NS',   name: 'Endurance Technologies',          exchange: 'NSE', qty: 9,     avgCost: 2400.64 },
  { symbol: 'ETERNAL.NS',     name: 'Eternal (Zomato)',                 exchange: 'NSE', qty: 300,   avgCost: 97.91   },

  { symbol: 'HAPPYFORGE.NS',  name: 'Happy Forgings',                  exchange: 'NSE', qty: 17,    avgCost: 1289.4  },
  { symbol: 'HDFCBANK.NS',    name: 'HDFC Bank',                       exchange: 'NSE', qty: 340,   avgCost: 726.52  },
  { symbol: 'HDFCNEXT50.NS',  name: 'HDFC Nifty NEXT 50 ETF',        exchange: 'NSE', qty: 2600,  avgCost: 69.13   },
  { symbol: 'INDIANB.NS',     name: 'Indian Bank',                     exchange: 'NSE', qty: 186,   avgCost: 627.29  },
  { symbol: 'INDUSTOWER.NS',  name: 'Indus Towers',                    exchange: 'NSE', qty: 379,   avgCost: 435.55  },
  { symbol: 'KARURVYSYA.NS',  name: 'Karur Vysya Bank',                exchange: 'NSE', qty: 630,   avgCost: 140.58  },
  { symbol: 'KIRLOSENG.NS',   name: 'Kirloskar Oil Engines Ltd',      exchange: 'NSE', qty: 109,   avgCost: 1156.98 },
  { symbol: 'LUMAXTECH.NS',   name: 'Lumax AutoTechnologies Ltd',     exchange: 'NSE', qty: 15,    avgCost: 1081.24 },
  { symbol: 'LUPIN.NS',       name: 'Lupin',                           exchange: 'NSE', qty: 72,    avgCost: 2310.79 },
  { symbol: 'M&M.NS',         name: 'Mahindra & Mahindra',             exchange: 'NSE', qty: 58,    avgCost: 1863.64 },
  { symbol: 'MANORAMA.NS',    name: 'Manorama Industries',             exchange: 'NSE', qty: 18,    avgCost: 1339.6  },
  { symbol: 'MID150BEES.NS',  name: 'Nippon India ETF Nifty Midcap 150', exchange: 'NSE', qty: 2220, avgCost: 215.15 },
  { symbol: 'MON100.NS',      name: 'Motilal Oswal Nasdaq 100 ETF',   exchange: 'NSE', qty: 300,   avgCost: 152.73  },
  { symbol: 'NATIONALUM.NS',  name: 'National Aluminium Company',      exchange: 'NSE', qty: 433,   avgCost: 265.83  },
  { symbol: 'NBCC.NS',        name: 'NBCC (India)',                    exchange: 'NSE', qty: 270,   avgCost: 104.72  },
  { symbol: 'NESTLEIND.NS',   name: 'Nestle India Ltd',               exchange: 'NSE', qty: 100,   avgCost: 1011.43 },
  { symbol: 'NH.NS',          name: 'Narayana Hrudayalaya Ltd',       exchange: 'NSE', qty: 110,   avgCost: 1749.02 },
  { symbol: 'NIFTYBEES.NS',   name: 'Nippon India ETF Nifty 50 BeES', exchange: 'NSE', qty: 2600,  avgCost: 258.87  },
  { symbol: 'PRICOLLTD.NS',   name: 'Pricol',                          exchange: 'NSE', qty: 42,    avgCost: 604.85  },
  { symbol: 'PRIVISCL.NS',    name: 'Privi Speciality Chemicals',      exchange: 'NSE', qty: 9,     avgCost: 3209.6  },
  { symbol: 'RRKABEL.NS',     name: 'RR Kabel',                        exchange: 'NSE', qty: 16,    avgCost: 1382.67 },
  { symbol: 'SHRIPISTON.NS',  name: 'Shriram Pistons & Rings',         exchange: 'NSE', qty: 9,     avgCost: 2584.24 },

  { symbol: 'SMALLCAP.NS',    name: 'Mirae Asset Nifty Smallcap 250 Momentum Quality 100 ETF', exchange: 'NSE', qty: 5041,  avgCost: 43.86   },
  { symbol: 'SOUTHBANK.NS',   name: 'South Indian Bank',               exchange: 'NSE', qty: 4457,  avgCost: 39.63   },
  { symbol: 'TATASTEEL.NS',   name: 'Tata Steel',                      exchange: 'NSE', qty: 600,   avgCost: 126.15  },
  { symbol: 'TDPOWERSYS.NS',  name: 'TD Power Systems',                exchange: 'NSE', qty: 29,    avgCost: 506.49  },
  { symbol: 'TMCV.NS',        name: 'Tata Motors Ltd',                 exchange: 'NSE', qty: 100,   avgCost: 250.12  },
  { symbol: 'UNIONBANK.NS',   name: 'Union Bank of India',             exchange: 'NSE', qty: 936,   avgCost: 118.43  },
  { symbol: 'WELCORP.NS',     name: 'Welspun Corp',                    exchange: 'NSE', qty: 28,    avgCost: 852.57  },
];

export const defaultUSStocks = [
  { symbol: 'QQQ',  name: 'Invesco QQQ Trust Series 1',  exchange: 'NASDAQ', qty: 1.862977474, avgCost: 609.73 },
  { symbol: 'TSLA', name: 'Tesla, Inc.',                  exchange: 'NASDAQ', qty: 1,           avgCost: 183.22 },
  { symbol: 'META', name: 'Meta Platforms Inc',            exchange: 'NASDAQ', qty: 0.605856569, avgCost: 188.66 },
  { symbol: 'MSFT', name: 'Microsoft Corporation',        exchange: 'NASDAQ', qty: 0.394432173, avgCost: 245.92 },
  { symbol: 'AAPL', name: 'Apple, Inc.',                   exchange: 'NASDAQ', qty: 0.641494286, avgCost: 140.30 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.',               exchange: 'NASDAQ', qty: 0.560077192, avgCost: 112.48 },
];


export const defaultGoldETFs = [
  { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', exchange: 'NSE', qty: 4090,  avgCost: 112.38 },
  { symbol: 'GOLDCASE',  name: 'Zerodha Gold ETF',           exchange: 'NSE', qty: 60000, avgCost: 13.49  },
];

export const defaultSilverETFs = [
  { symbol: 'SILVERIETF', name: 'Nippon India Silver ETF', exchange: 'NSE', qty: 1800, avgCost: 98.15 },
];

export const defaultGold = [
  { name: 'Digital Gold',    type: 'digital', grams: 1.4397, avgCost: 10420 },
  { name: 'SGB Tranche 1',   type: 'sgb',     grams: 10,     avgCost: 6150  },
  { name: 'SGB Tranche 2',   type: 'sgb',     grams: 10,     avgCost: 4210  },
  { name: 'SGB Tranche 3',   type: 'sgb',     grams: 10,     avgCost: 4590  },
  { name: 'SGB Tranche 4',   type: 'sgb',     grams: 10,     avgCost: 5280  },
  { name: 'SGB Tranche 5',   type: 'sgb',     grams: 10,     avgCost: 5280  },
  { name: 'SGB Tranche 6',   type: 'sgb',     grams: 10,     avgCost: 4730  },
  { name: 'SGB Tranche 7',   type: 'sgb',     grams: 10,     avgCost: 5870  },
  { name: 'SGB Tranche 8',   type: 'sgb',     grams: 10,     avgCost: 6210  },
];

// Scheme codes from mfapi.in — edit any entry via the UI if a code is incorrect.
// NOTE: Increment DATA_VERSION in src/utils/storage.js whenever this list changes
// so that all users automatically get the updated data on their next page load.
// Units and avgCost sourced from CAS statement dated 02-Apr-2026.
export const defaultMutualFunds = [
  {
    schemeCode: '120465',
    schemeName: 'Axis Large Cap Fund - Direct Plan Growth',
    units: 1173.943,
    avgCost: 58.78,
  },
  {
    schemeCode: '148063',
    schemeName: 'Edelweiss US Technology Equity Fund of Fund - Direct Plan Growth',
    units: 3407.564,
    avgCost: 29.93,
  },
  {
    schemeCode: '118551',
    schemeName: 'Franklin U.S. Opportunities Equity Active Fund of Funds - Direct Plan Growth',
    units: 101.906,
    avgCost: 49.07,
  },
  {
    schemeCode: '148473',
    schemeName: 'ICICI Prudential Nifty50 Value 20 Index Fund - Direct Plan Growth',
    units: 12873.422,
    avgCost: 10.80,
  },
  {
    schemeCode: '120603',
    schemeName: 'ICICI Prudential All Seasons Bond Fund - Direct Plan Growth',
    units: 7476.554,
    avgCost: 40.12,
  },
  {
    schemeCode: '120684',
    schemeName: 'ICICI Prudential Nifty Next 50 Index Fund - Direct Plan Growth',
    units: 2782.509,
    avgCost: 61.74,
  },
  {
    schemeCode: '120166',
    schemeName: 'Kotak Flexicap Fund - Direct Plan Growth',
    units: 924.936,
    avgCost: 74.60,
  },
  {
    schemeCode: '118834',
    schemeName: 'Mirae Asset Large & Midcap Fund - Direct Plan Growth',
    units: 222.004,
    avgCost: 103.60,
  },
  {
    schemeCode: '152459',
    schemeName: 'Mirae Asset Nifty Smallcap 250 Momentum Quality 100 ETF FoF - Direct Plan Growth',
    units: 14491.170,
    avgCost: 9.80,
  },
  {
    schemeCode: '127042',
    schemeName: 'Motilal Oswal Midcap Fund - Direct Plan Growth',
    units: 1644.486,
    avgCost: 112.49,
  },
  {
    schemeCode: '149039',
    schemeName: 'Navi Nifty 50 Index Fund - Direct Plan Growth',
    units: 20781.077,
    avgCost: 15.62,
  },
  {
    schemeCode: '149910',
    schemeName: 'Navi Nasdaq100 US Specific Equity Passive FoF - Direct Plan Growth',
    units: 1332.603,
    avgCost: 12.76,
  },
  {
    // Combined: Non-Demat folio (234.613 units, ₹10,000) + Demat folio (3,412.535 units, ₹3,05,800)
    schemeCode: '122639',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan Growth',
    units: 3647.148,
    avgCost: 86.59,
  },
  {
    schemeCode: '120828',
    schemeName: 'Quant Small Cap Fund - Direct Plan Growth',
    units: 896.677,
    avgCost: 273.89,
  },
  {
    schemeCode: '119800',
    schemeName: 'SBI Liquid Fund - Direct Plan Growth',
    units: 23.769,
    avgCost: 4207.23,
  },
];
