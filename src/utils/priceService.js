const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const fetchStockPrice = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    const price = result.meta?.regularMarketPrice;
    const prevClose = result.meta?.chartPreviousClose || result.meta?.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    return {
      price,
      previousClose: prevClose,
      change,
      changePercent,
      currency: result.meta?.currency || 'INR',
      exchangeName: result.meta?.exchangeName,
    };
  } catch {
    return null;
  }
};

export const fetchMFPrice = async (schemeCode) => {
  try {
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const latestNav = data.data?.[0];
    const prevNav = data.data?.[1];
    const nav = parseFloat(latestNav?.nav);
    const prevNavVal = parseFloat(prevNav?.nav || nav);
    return {
      nav,
      previousNav: prevNavVal,
      change: nav - prevNavVal,
      changePercent: prevNavVal ? ((nav - prevNavVal) / prevNavVal) * 100 : 0,
      date: latestNav?.date,
      schemeName: data.meta?.scheme_name,
    };
  } catch {
    return null;
  }
};

// Gold/Silver prices in INR per gram (approximate MCX rates)
// In a real app, this would come from a metals API like metals-api.com
export const fetchGoldSilverPrice = async () => {
  try {
    // Try to fetch from a free gold API
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent('https://data-asg.goldprice.org/dbXRates/INR')}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (response.ok) {
      const data = await response.json();
      const goldPerOz = data.items?.[0]?.xauPrice;
      const silverPerOz = data.items?.[0]?.xagPrice;
      if (goldPerOz && silverPerOz) {
        const TROY_OZ_TO_GRAM = 31.1035;
        return {
          gold: goldPerOz / TROY_OZ_TO_GRAM,
          silver: silverPerOz / TROY_OZ_TO_GRAM,
          source: 'live',
        };
      }
    }
  } catch {
    // fall through to static
  }
  return {
    gold: 9200,   // per gram INR (approximate)
    silver: 105,  // per gram INR (approximate)
    source: 'static',
  };
};

export const fetchMultipleStocks = async (symbols) => {
  const results = {};
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const data = await fetchStockPrice(symbol);
      if (data) results[symbol] = data;
    })
  );
  return results;
};

export const fetchMultipleMFs = async (schemeCodes) => {
  const results = {};
  await Promise.allSettled(
    schemeCodes.map(async (code) => {
      const data = await fetchMFPrice(code);
      if (data) results[code] = data;
    })
  );
  return results;
};
