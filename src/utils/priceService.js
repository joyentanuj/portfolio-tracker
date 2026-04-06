const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
];

async function fetchWithFallback(url, timeoutMs = 10000) {
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return response;
      console.warn(`[priceService] Proxy ${proxy} returned status ${response.status} for ${url}`);
    } catch (err) {
      console.warn(`[priceService] Proxy ${proxy} failed for ${url}:`, err?.message ?? err);
    }
  }
  return null;
}

export const fetchStockPrice = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetchWithFallback(url);
    if (!response) {
      console.warn(`[priceService] No response for ${symbol} from any proxy`);
      return null;
    }
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      console.warn(`[priceService] No chart result for ${symbol}`);
      return null;
    }
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
  } catch (err) {
    console.warn(`[priceService] Error fetching ${symbol}:`, err);
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

// Gold/Silver prices in INR per gram via Yahoo Finance commodity tickers
const TROY_OZ_TO_GRAM = 31.1035;
// Fallback USD/INR rate if live forex fetch fails (last updated April 2026)
const FALLBACK_USD_INR_RATE = 85.0;
// Sanity check bounds for USD/INR rate (historically between 40 and 150; bounds set wide for future-proofing)
const MIN_VALID_USD_INR_RATE = 50;
const MAX_VALID_USD_INR_RATE = 200;

export const fetchUSDINRFromGoogle = async () => {
  try {
    // Google Finance currency page
    const url = 'https://www.google.com/finance/quote/USD-INR';
    const response = await fetchWithFallback(url, 8000);
    if (response) {
      const html = await response.text();
      // Parse the exchange rate from data-last-price attribute
      const priceMatch = html.match(/data-last-price="([^"]+)"/);
      if (priceMatch) {
        const rate = parseFloat(priceMatch[1]);
        if (rate > MIN_VALID_USD_INR_RATE && rate < MAX_VALID_USD_INR_RATE) {
          const prevCloseMatch = html.match(/data-previous-close="([^"]+)"/);
          const prevClose = prevCloseMatch ? parseFloat(prevCloseMatch[1]) : rate;
          return {
            price: rate,
            previousClose: prevClose,
            change: rate - prevClose,
            changePercent: prevClose ? ((rate - prevClose) / prevClose) * 100 : 0,
            source: 'google',
            currency: 'INR',
          };
        }
      }
    }
  } catch (err) {
    console.warn('[priceService] Google Finance USD/INR error:', err);
  }

  // Fallback to Yahoo Finance
  try {
    const yahooData = await fetchStockPrice('USDINR=X');
    if (yahooData?.price) {
      return { ...yahooData, source: 'yahoo', currency: 'INR' };
    }
  } catch {
    // fall through
  }

  // Last resort static fallback
  return {
    price: 85.0,
    previousClose: 85.0,
    change: 0,
    changePercent: 0,
    source: 'static',
    currency: 'INR',
  };
};

export const fetchGoldSilverPrice = async () => {
  try {
    // Fetch gold, silver, and USD/INR in parallel
    const [goldData, silverData, forexData] = await Promise.all([
      fetchStockPrice('GC=F'),
      fetchStockPrice('SI=F'),
      fetchUSDINRFromGoogle(),
    ]);

    const usdInr = forexData?.price || FALLBACK_USD_INR_RATE;
    const goldPerGramINR = goldData?.price ? (goldData.price / TROY_OZ_TO_GRAM) * usdInr : null;
    const silverPerGramINR = silverData?.price ? (silverData.price / TROY_OZ_TO_GRAM) * usdInr : null;

    if (goldPerGramINR && silverPerGramINR) {
      return {
        gold: Math.round(goldPerGramINR * 100) / 100,
        silver: Math.round(silverPerGramINR * 100) / 100,
        source: 'live',
      };
    }
  } catch (err) {
    console.warn('[priceService] Gold/Silver fetch error:', err);
  }

  // Fallback: use MCX ETF prices as proxy
  try {
    const [goldETF, silverETF] = await Promise.all([
      fetchStockPrice('GOLDBEES.NS'),
      fetchStockPrice('SILVERIETF.NS'),
    ]);

    if (goldETF?.price || silverETF?.price) {
      return {
        // GOLDBEES tracks ~1/100th of 1g gold; ~125 converts unit price to INR/gram (approximate)
        gold: goldETF?.price ? Math.round(goldETF.price * 125 * 100) / 100 : 15000,
        // SILVERIETF tracks ~1/100th of 1g silver; ~5.2 converts unit price to INR/gram (approximate)
        silver: silverETF?.price ? Math.round(silverETF.price * 5.2 * 100) / 100 : 500,
        source: 'etf-proxy',
      };
    }
  } catch {
    // fall through to static
  }

  // Last resort static fallback (updated April 2026)
  return {
    gold: 15000,  // per gram INR (approximate)
    silver: 500,  // per gram INR (approximate)
    source: 'static',
  };
};

// Fetch an Indian ETF price from Google Finance (NSE) with Yahoo Finance as fallback.
export const fetchGoogleFinancePrice = async (symbol) => {
  try {
    const url = `https://www.google.com/finance/quote/${symbol}:NSE`;
    const response = await fetchWithFallback(url, 8000);
    if (response) {
      const html = await response.text();
      const priceMatch = html.match(/data-last-price="([^"]+)"/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        const prevCloseMatch = html.match(/data-previous-close="([^"]+)"/);
        const prevClose = prevCloseMatch ? parseFloat(prevCloseMatch[1]) : price;
        return {
          price,
          previousClose: prevClose,
          change: price - prevClose,
          changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          source: 'google',
        };
      }
    }
  } catch (err) {
    console.warn(`[priceService] Google Finance error for ${symbol}:`, err);
  }

  // Fallback: try Yahoo Finance with NSE ticker
  try {
    return await fetchStockPrice(`${symbol}.NS`);
  } catch {
    return null;
  }
};

// Fetch a forex rate from Google Finance (e.g. USD-INR) with Yahoo Finance as fallback.
const FOREX_FETCH_TIMEOUT_MS = 8000;
export const fetchGoogleForexRate = async (fromCurrency, toCurrency) => {
  try {
    const url = `https://www.google.com/finance/quote/${fromCurrency}-${toCurrency}`;
    const response = await fetchWithFallback(url, FOREX_FETCH_TIMEOUT_MS);
    if (response) {
      const html = await response.text();
      const priceMatch = html.match(/data-last-price="([^"]+)"/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        const prevCloseMatch = html.match(/data-previous-close="([^"]+)"/);
        const prevClose = prevCloseMatch ? parseFloat(prevCloseMatch[1]) : price;
        return {
          price,
          previousClose: prevClose,
          change: price - prevClose,
          changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          source: 'google',
        };
      }
    }
  } catch (err) {
    console.warn(`[priceService] Google Finance forex error for ${fromCurrency}-${toCurrency}:`, err);
  }
  // Fallback to Yahoo Finance
  return fetchStockPrice(`${fromCurrency}${toCurrency}=X`);
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
