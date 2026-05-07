import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatXIRR } from '../../utils/formatters';

const SECTOR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#84cc16', '#0ea5e9', '#a855f7'];
const CONCENTRATION_THRESHOLD = 35;
const SYMBOL_SECTOR = {
  ...Object.fromEntries([
    'BANK', 'HDFC', 'HDFCBANK', 'HDFC BANK', 'ICICI', 'ICICIBANK', 'ICICI BANK', 'SBIN', 'STATE BANK OF INDIA',
    'AXIS', 'AXISBANK', 'AXIS BANK', 'KOTAK', 'KOTAKBANK', 'KOTAK MAHINDRA', 'INDUSIND', 'INDUSINDBK',
    'ADITYA BIRLA CAPITAL', 'ABCAPITAL', 'BANK OF INDIA', 'BANKINDIA', 'CANARA BANK', 'CANBK', 'INDIAN BANK',
    'INDIANB', 'KARUR VYSYA', 'KARURVYSYA', 'UNION BANK', 'UNIONBANK', 'SOUTH INDIAN BANK', 'SOUTHBANK',
    'FEDERAL BANK', 'FEDBANK', 'PNB', 'PUNJAB NATIONAL BANK', 'BANK OF BARODA', 'YES BANK', 'IDFCFIRSTB',
    'BAJAJ FINANCE', 'BAJFINANCE', 'BAJAJ FINSERV', 'BAJAJFINSV', 'JIO FINANCIAL', 'JPM', 'JPMORGAN',
    'BAC', 'BANK OF AMERICA', 'GS', 'GOLDMAN SACHS', 'V', 'VISA', 'MA', 'MASTERCARD',
  ].map(key => [key, 'Finance'])),
  ...Object.fromEntries([
    'INFY', 'INFOSYS', 'TCS', 'TATA CONSULTANCY', 'WIPRO', 'HCLTECH', 'HCL', 'HCL TECHNOLOGIES',
    'TECHM', 'TECH MAHINDRA', 'LTIM', 'LTIMINDTREE', 'LTI', 'MINDTREE', 'PERSISTENT', 'MPHASIS', 'COFORGE',
    'OFSS', 'ORACLE FINANCIAL', 'AAPL', 'APPLE', 'MSFT', 'MICROSOFT', 'GOOGL', 'GOOG', 'GOOGLE', 'ALPHABET',
    'META', 'META PLATFORMS', 'AMZN', 'AMAZON', 'NVDA', 'NVIDIA', 'NFLX', 'NETFLIX', 'TSLA', 'TESLA',
    'ADBE', 'ADOBE', 'CRM', 'SALESFORCE', 'AMD', 'ORCL', 'QQQ',
  ].map(key => [key, 'IT'])),
  ...Object.fromEntries([
    'SUN PHARMA', 'SUNPHARMA', 'SUN', 'CIPLA', 'DR REDDY', 'DRREDDY', 'DIVIS', 'DIVISLAB', 'BIOCON', 'LUPIN',
    'AUROBINDO', 'AUROPHARMA', 'TORRENT PHARMA', 'TORNTPHARM', 'MANKIND', 'ABBOTT', 'APOLLO HOSPITALS',
    'APOLLOHOSP', 'NARAYANA HRUDAYALAYA', 'NH', 'MAX HEALTHCARE', 'MAXHEALTH', 'JNJ',
    'JOHNSON AND JOHNSON', 'PFE', 'PFIZER', 'UNH', 'UNITEDHEALTH',
  ].map(key => [key, 'Healthcare'])),
  ...Object.fromEntries([
    'RELIANCE', 'ONGC', 'BPCL', 'IOC', 'INDIAN OIL', 'HPCL', 'HINDUSTAN PETROLEUM', 'GAIL', 'OIL INDIA',
    'PETRONET', 'ADANI TOTAL GAS', 'ADANITOTALGAS',
  ].map(key => [key, 'Energy'])),
  ...Object.fromEntries([
    'TATA MOTORS', 'TATAMOTORS', 'TMCV', 'MARUTI', 'MARUTI SUZUKI', 'BAJAJ AUTO', 'BAJAJAUTO',
    'HERO MOTOCORP', 'HEROMOTOCO', 'M AND M', 'M&M', 'MAHINDRA AND MAHINDRA', 'EICHER', 'EICHERMOT',
    'ASHOK LEYLAND', 'ASHOKLEY', 'TVS MOTOR', 'TVSMOTOR', 'ENDURANCE', 'ENDURANCE TECHNOLOGIES',
    'LUMAX AUTOTECHNOLOGIES', 'LUMAXTECH', 'PRICOL', 'SHRIRAM PISTONS', 'SHRIPISTON', 'HAPPY FORGINGS',
    'HAPPYFORGE',
  ].map(key => [key, 'Automobile'])),
  ...Object.fromEntries([
    'HUL', 'HINDUSTAN UNILEVER', 'ITC', 'NESTLE', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'GODREJ CONSUMER',
    'GODREJCP', 'MARICO', 'EMAMI', 'COLPAL', 'COLGATE', 'TATA CONSUMER', 'TATACONSUM', 'KO', 'COCA COLA',
    'PEP', 'PEPSICO', 'PG', 'PROCTER AND GAMBLE', 'MANORAMA',
  ].map(key => [key, 'FMCG'])),
  ...Object.fromEntries([
    'TATA STEEL', 'TATASTEEL', 'JSW STEEL', 'JSWSTEEL', 'HINDALCO', 'COAL INDIA', 'COALINDIA', 'VEDANTA',
    'VEDL', 'NMDC', 'SAIL', 'NALCO', 'NATIONAL ALUMINIUM', 'NATIONALUM', 'JINDAL STEEL', 'JINDALSTEL',
    'WELCORP',
  ].map(key => [key, 'Metals'])),
  ...Object.fromEntries([
    'LARSEN AND TOUBRO', 'LARSEN TOUBRO', 'L AND T', 'LT', 'ULTRATECH', 'ULTRACEMCO', 'ADANI PORTS',
    'ADANIPORTS', 'ACC', 'AMBUJA', 'NBCC', 'IRB', 'IRCON', 'RVNL',
  ].map(key => [key, 'Infrastructure'])),
  ...Object.fromEntries([
    'BHARTI AIRTEL', 'BHARTIARTL', 'AIRTEL', 'BHARTI HEXACOM', 'BHARTIHEXA', 'INDUS TOWERS', 'INDUSTOWER',
    'VODAFONE IDEA', 'IDEA', 'SUNIL BHARTI', 'RELIANCE JIO',
  ].map(key => [key, 'Telecom'])),
  ...Object.fromEntries([
    'TITAN', 'HAVELLS', 'VOLTAS', 'BLUE STAR', 'BLUESTARCO', 'DIXON', 'CROMPTON', 'WHIRLPOOL', 'RR KABEL',
    'RRKABEL',
  ].map(key => [key, 'Consumer Durables'])),
  ...Object.fromEntries([
    'DMART', 'AVENUE SUPERMARTS', 'AVENUESUPER', 'TRENT', 'WMT', 'WALMART', 'TGT', 'TARGET', 'COST',
    'COSTCO', 'NKE', 'NIKE', 'ETERNAL', 'ZOMATO', 'PVR RETAIL',
  ].map(key => [key, 'Retail'])),
  ...Object.fromEntries([
    'UPL', 'PI INDUSTRIES', 'PIIND', 'DEEPAK NITRITE', 'DEEPAKNTR', 'AARTI', 'AARTIIND',
    'COROMANDEL', 'PRIVI SPECIALITY', 'PRIVISCL', 'SRF', 'TATA CHEMICALS', 'TATACHEM',
  ].map(key => [key, 'Chemicals'])),
  ...Object.fromEntries([
    'NTPC', 'POWER GRID', 'POWERGRID', 'ADANI POWER', 'ADANIPOWER', 'TATA POWER', 'TATAPOWER',
    'JSW ENERGY', 'JSWENERGY', 'TORRENT POWER', 'TORNTPOWER', 'NHPC', 'SJVN', 'TD POWER', 'TDPOWERSYS',
  ].map(key => [key, 'Power'])),
  ...Object.fromEntries([
    'DLF', 'GODREJ PROPERTIES', 'GODREJPROP', 'OBEROI REALTY', 'OBEROIRLTY', 'BRIGADE', 'PRESTIGE',
    'PHOENIX', 'MACROTECH', 'LODHA', 'SOBHA',
  ].map(key => [key, 'Real Estate'])),
  ...Object.fromEntries([
    'HAL', 'HINDUSTAN AERONAUTICS', 'BEL', 'BHARAT ELECTRONICS', 'BDL', 'BHARAT DYNAMICS',
    'COCHIN SHIPYARD', 'COCHINSHIP', 'PARAS DEFENCE',
  ].map(key => [key, 'Aerospace'])),
  ...Object.fromEntries([
    'SUN TV', 'SUNTV', 'ZEE', 'ZEEL', 'PVR INOX', 'PVRINOX', 'PVR', 'INOX', 'NETWORK18', 'TV18',
  ].map(key => [key, 'Media'])),
  ...Object.fromEntries([
    'AIA ENGINEERING', 'AIAENG', 'SIEMENS', 'ABB', 'CUMMINS', 'KIRLOSKAR OIL', 'KIRLOSENG', 'CG POWER',
    'CGPOWER',
  ].map(key => [key, 'Industrial'])),
  ...Object.fromEntries([
    'NIFTY 50', 'NEXT 50', 'MIDCAP 150', 'SMALLCAP 250', 'NASDAQ 100', 'MON100', 'NIFTYBEES',
    'MID150BEES', 'SMALLCAP', 'HDFCNEXT50', 'INDEX FUND',
  ].map(key => [key, 'Index Funds'])),
};

function normalizeLookupValue(value = '') {
  return String(value)
    .toUpperCase()
    .replace(/\.[A-Z]{1,5}\b/g, ' ')
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\b(LTD|LIMITED|INDUSTRIES|INDUSTRY|CORPORATION|CORP|INC|INCORPORATED|COMPANY|CO|PLC|TRUST|HOLDINGS|HOLDING|SEZ|ETF|BEES|SERIES|CLASS)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SECTOR_MATCHES = Object.entries(SYMBOL_SECTOR)
  .sort(([a], [b]) => b.length - a.length)
  .map(([pattern, sector]) => ({
    sector,
    normalizedPattern: normalizeLookupValue(pattern),
    compactPattern: normalizeLookupValue(pattern).replace(/\s+/g, ''),
  }));

function mapSector(name = '', symbol = '') {
  const normalizedName = normalizeLookupValue(name);
  const normalizedSymbol = normalizeLookupValue(symbol).replace(/\s+/g, '');
  const paddedKey = ` ${[normalizedName, normalizedSymbol].filter(Boolean).join(' ')} `;
  const match = SECTOR_MATCHES.find(({ normalizedPattern, compactPattern }) => {
    return normalizedSymbol === compactPattern || paddedKey.includes(` ${normalizedPattern} `);
  });
  return match ? match.sector : 'Others';
}

export default function SectorBreakdown() {
  const { data, getAssetStats } = usePortfolio();

  const sectors = useMemo(() => {
    const grouped = {};
    [...(data.stocks || []), ...(data.usStocks || [])].forEach(asset => {
      const category = asset.category || (data.stocks?.some(s => s.id === asset.id) ? 'stocks' : 'usStocks');
      const s = getAssetStats(asset, category);
      const sector = mapSector(asset.name, asset.symbol);
      grouped[sector] = grouped[sector] || { name: sector, value: 0, pnl: 0, xirrValues: [] };
      grouped[sector].value += s.currentValue || 0;
      grouped[sector].pnl += s.pnl || 0;
      if (s.xirr !== null) grouped[sector].xirrValues.push(s.xirr);
    });

    const list = Object.values(grouped).map(s => ({
      ...s,
      xirr: s.xirrValues.length ? s.xirrValues.reduce((a, b) => a + b, 0) / s.xirrValues.length : null,
    }));

    const total = list.reduce((sum, s) => sum + s.value, 0) || 1;
    return list
      .map(s => ({ ...s, allocation: (s.value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [data, getAssetStats]);

  if (!sectors.length) return <p className="text-sm text-gray-500 dark:text-gray-400">Add stock holdings to view sector allocation.</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sectors} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
              {sectors.map((s, i) => <Cell key={s.name} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {sectors.map((s, i) => (
          <div key={s.name} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                <span className="font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                {s.allocation > CONCENTRATION_THRESHOLD && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Over-concentrated sector" />}
              </div>
              <span className="text-gray-500 dark:text-gray-400">{s.allocation.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between mt-1 text-gray-600 dark:text-gray-300">
              <span>{formatCurrency(s.pnl)}</span>
              <span>{formatXIRR(s.xirr)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
