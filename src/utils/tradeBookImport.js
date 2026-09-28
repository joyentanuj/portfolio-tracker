import * as XLSX from '@e965/xlsx';

const REQUIRED_HEADERS = ['symbol', 'type', 'quantity', 'price'];
const DEFAULT_TRADE_DATE = '1970-01-01';

function generateImportId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const SUPPORTED_TRADE_BOOK_HEADERS = {
  symbol: ['Symbol', 'Stock', 'Scrip', 'Ticker', 'Security'],
  isin: ['ISIN'],
  type: ['Buy/Sell', 'Side', 'Transaction Type', 'Action', 'Type'],
  quantity: ['Qty', 'Quantity', 'Shares', 'Units'],
  price: ['Rate', 'Price', 'Trade Price', 'Average Price'],
  date: ['Trade Date', 'Date', 'Transaction Date', 'Execution Date'],
  exchange: ['Exchange', 'Segment', 'Market'],
  orderId: ['Order ID', 'Order No', 'Order Number'],
  tradeId: ['Trade ID', 'Trade No', 'Trade Number'],
  name: ['Stock Name', 'Company Name', 'Security Name', 'Instrument'],
};

const HEADER_LOOKUP = Object.entries(SUPPORTED_TRADE_BOOK_HEADERS).reduce((lookup, [key, aliases]) => {
  aliases.forEach((alias) => {
    lookup.set(normalizeHeader(alias), key);
  });
  return lookup;
}, new Map());

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_/()-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeIdentifier(value) {
  return normalizeText(value).replace(/\s+/g, '').toUpperCase();
}

function normalizeExchange(value) {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return '';
  if (normalized.includes('NSE')) return 'NSE';
  if (normalized.includes('BSE')) return 'BSE';
  if (normalized.includes('NASDAQ') || normalized.includes('NYSE') || normalized === 'US' || normalized.includes('USA')) return 'US';
  return normalized;
}

function looksLikeIsin(value) {
  return /^[A-Z]{2}[A-Z0-9]{10}$/.test(value);
}

function normalizeSymbol(value, exchange) {
  const raw = normalizeIdentifier(value);
  if (!raw) return '';

  const symbol = raw.includes(':') ? raw.split(':').pop() : raw;
  if (!symbol || looksLikeIsin(symbol) || symbol.includes('.') || symbol.includes('=')) {
    return symbol;
  }

  if (exchange === 'NSE') return `${symbol}.NS`;
  if (exchange === 'BSE') return `${symbol}.BO`;
  return symbol;
}

function inferExchange(symbol, exchange) {
  if (exchange) return exchange;
  if (symbol.endsWith('.NS')) return 'NSE';
  if (symbol.endsWith('.BO')) return 'BSE';
  return '';
}

function formatMissingHeaders(missingColumns) {
  return missingColumns.map((key) => SUPPORTED_TRADE_BOOK_HEADERS[key][0]).join(', ');
}

function resolveHeaderMap(headerRow) {
  const mapping = {};
  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    const canonical = HEADER_LOOKUP.get(normalized);
    if (canonical && mapping[canonical] == null) {
      mapping[canonical] = index;
    }
  });
  return mapping;
}

function isEmptyRow(row = []) {
  return !row.some((cell) => normalizeText(cell) !== '');
}

function parsePositiveNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const cleaned = normalizeText(value)
    .replace(/[₹$,]/g, '')
    .replace(/\s+/g, '')
    .replace(/^\((.*)\)$/, '-$1');

  if (!cleaned) return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeTradeType(value) {
  const normalized = normalizeHeader(value);
  if (!normalized) return '';
  if (normalized === 'b') return 'buy';
  if (normalized === 's') return 'sell';
  if (normalized.includes('buy')) return 'buy';
  if (normalized.includes('sell')) return 'sell';
  return '';
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function normalizeTradeDate(value, options = {}) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value, { date1904: options.date1904 });
    if (parsed?.y && parsed?.m && parsed?.d) {
      return toIsoDate(parsed.y, parsed.m, parsed.d);
    }
  }

  const text = normalizeText(value);
  if (!text) return '';

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dmyMatch = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const year = Number(dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3]);
    return toIsoDate(year, Number(dmyMatch[2]), Number(dmyMatch[1]));
  }

  return '';
}

function getRowValue(row, mapping, key) {
  const index = mapping[key];
  return index == null ? '' : row[index];
}

function normalizeFingerprintValue(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeFingerprintNumber(value) {
  return Number(value).toFixed(8).replace(/\.?0+$/, '');
}

export function buildTradeFingerprint({
  symbol,
  type,
  quantity,
  price,
  date,
  exchange,
  orderId,
  tradeId,
}) {
  const identifier = normalizeIdentifier(tradeId) || normalizeIdentifier(orderId);
  const baseParts = [
    normalizeFingerprintValue(symbol),
    normalizeFingerprintValue(type),
    normalizeFingerprintValue(date || DEFAULT_TRADE_DATE),
    normalizeFingerprintNumber(quantity),
    normalizeFingerprintNumber(price),
    normalizeFingerprintValue(exchange),
  ];

  return identifier
    ? [
        'id',
        identifier,
        normalizeFingerprintValue(symbol),
        normalizeFingerprintValue(type),
        normalizeFingerprintValue(exchange),
      ].join('|')
    : ['trade', ...baseParts].join('|');
}

function getExistingTradeFingerprint(asset, transaction) {
  if (!transaction || !['buy', 'sell'].includes(transaction.type)) {
    return '';
  }

  return transaction.importFingerprint || buildTradeFingerprint({
    symbol: asset.symbol,
    type: transaction.type,
    quantity: Number(transaction.quantity),
    price: Number(transaction.price),
    date: transaction.date,
    exchange: transaction.exchange || asset.exchange || '',
    orderId: transaction.orderId,
    tradeId: transaction.tradeId,
  });
}

function getHoldingQuantity(transactions = []) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === 'buy') return total + Number(transaction.quantity || 0);
    if (transaction.type === 'sell') return total - Number(transaction.quantity || 0);
    return total;
  }, 0);
}

function cloneStocks(stocks = []) {
  return stocks.map((stock) => ({
    ...stock,
    transactions: [...(stock.transactions || [])],
  }));
}

function sortImportTrades(trades) {
  return [...trades].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    if (left.type !== right.type) return left.type === 'buy' ? -1 : 1;
    return left.rowNumber - right.rowNumber;
  });
}

export function parseTradeBookRows(sheetRows = [], options = {}) {
  const headerRowIndex = sheetRows.findIndex((row) => !isEmptyRow(row));
  if (headerRowIndex === -1) {
    return {
      rows: [],
      errors: [],
      totalRows: 0,
      missingColumns: REQUIRED_HEADERS,
      fatalError: 'The workbook is empty.',
    };
  }

  const headerMap = resolveHeaderMap(sheetRows[headerRowIndex]);
  const missingColumns = REQUIRED_HEADERS.filter((key) => key !== 'symbol' && headerMap[key] == null);
  if (headerMap.symbol == null && headerMap.isin == null) {
    missingColumns.unshift('symbol');
  }
  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [],
      totalRows: 0,
      missingColumns,
      fatalError: `Missing required columns: ${formatMissingHeaders(missingColumns)}.`,
    };
  }

  const rows = [];
  const errors = [];
  let totalRows = 0;

  for (let index = headerRowIndex + 1; index < sheetRows.length; index += 1) {
    const row = sheetRows[index] || [];
    if (isEmptyRow(row)) continue;

    totalRows += 1;
    const rowNumber = index + 1;
    const exchange = normalizeExchange(getRowValue(row, headerMap, 'exchange'));
    const rawSymbol = getRowValue(row, headerMap, 'symbol');
    const isin = normalizeIdentifier(getRowValue(row, headerMap, 'isin'));
    const symbol = normalizeSymbol(rawSymbol, exchange);
    const type = normalizeTradeType(getRowValue(row, headerMap, 'type'));
    const quantity = parsePositiveNumber(getRowValue(row, headerMap, 'quantity'));
    const price = parsePositiveNumber(getRowValue(row, headerMap, 'price'));
    const rawDate = getRowValue(row, headerMap, 'date');
    const date = normalizeTradeDate(rawDate, options) || DEFAULT_TRADE_DATE;
    const rowErrors = [];

    if (!symbol) {
      rowErrors.push(isin ? 'Rows with only an ISIN are not supported; include a tradable symbol or ticker' : 'Missing a usable symbol or stock identifier');
    }
    if (!type) {
      rowErrors.push('Transaction type must be buy or sell');
    }
    if (quantity == null) {
      rowErrors.push('Quantity must be a positive number');
    }
    if (price == null) {
      rowErrors.push('Trade price must be a positive number');
    }
    if (normalizeText(rawDate) && date === DEFAULT_TRADE_DATE) {
      rowErrors.push('Trade date is invalid');
    }

    if (rowErrors.length > 0) {
      errors.push({ rowNumber, message: rowErrors.join('; ') });
      continue;
    }

    const normalizedExchange = inferExchange(symbol, exchange);
    const name = normalizeText(getRowValue(row, headerMap, 'name'));
    const orderId = normalizeText(getRowValue(row, headerMap, 'orderId'));
    const tradeId = normalizeText(getRowValue(row, headerMap, 'tradeId'));

    rows.push({
      rowNumber,
      symbol,
      name,
      type,
      quantity,
      price,
      date,
      exchange: normalizedExchange,
      orderId,
      tradeId,
      fingerprint: buildTradeFingerprint({
        symbol,
        type,
        quantity,
        price,
        date,
        exchange: normalizedExchange,
        orderId,
        tradeId,
      }),
    });
  }

  return {
    rows,
    errors,
    totalRows,
    missingColumns: [],
    fatalError: '',
  };
}

export function parseTradeBookWorkbook(input) {
  const normalizedInput = input instanceof ArrayBuffer ? input : new Uint8Array(input);
  const workbook = XLSX.read(normalizedInput, { type: 'array', cellDates: true });
  const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
  const firstSheetName = workbook.SheetNames.find((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      raw: true,
      defval: '',
      blankrows: false,
    });
    return rows.length > 0;
  });

  if (!firstSheetName) {
    return {
      rows: [],
      errors: [],
      totalRows: 0,
      missingColumns: REQUIRED_HEADERS,
      fatalError: 'The workbook does not contain any readable sheets.',
    };
  }

  const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });

  return {
    ...parseTradeBookRows(sheetRows, { date1904 }),
    sheetName: firstSheetName,
  };
}

export async function parseTradeBookFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  return parseTradeBookWorkbook(arrayBuffer);
}

export function mergeTradeBookRowsIntoPortfolio(data, importResult, fileName = '') {
  const existingStocks = data.stocks || [];
  const currentHoldings = new Map();
  const knownFingerprints = new Set();

  existingStocks.forEach((stock) => {
    currentHoldings.set(stock.symbol, Math.max(0, getHoldingQuantity(stock.transactions)));
    (stock.transactions || []).forEach((transaction) => {
      const fingerprint = getExistingTradeFingerprint(stock, transaction);
      if (fingerprint) {
        knownFingerprints.add(fingerprint);
      }
    });
  });

  const errors = [...(importResult.errors || [])];
  const duplicateRows = [];
  const acceptedTrades = [];
  const updatedSymbols = new Set();
  let createdAssetsCount = 0;

  sortImportTrades(importResult.rows || []).forEach((trade) => {
    if (knownFingerprints.has(trade.fingerprint)) {
      duplicateRows.push({
        rowNumber: trade.rowNumber,
        symbol: trade.symbol,
        message: `Skipped duplicate trade for ${trade.symbol}`,
      });
      return;
    }

    const heldUnits = currentHoldings.get(trade.symbol) || 0;
    if (trade.type === 'sell' && trade.quantity > heldUnits + 1e-8) {
      errors.push({
        rowNumber: trade.rowNumber,
        message: `Cannot sell ${trade.quantity} units of ${trade.symbol}; only ${heldUnits} units are currently held`,
      });
      return;
    }

    knownFingerprints.add(trade.fingerprint);
    currentHoldings.set(
      trade.symbol,
      trade.type === 'buy' ? heldUnits + trade.quantity : Math.max(0, heldUnits - trade.quantity)
    );
    acceptedTrades.push(trade);
  });

  if (acceptedTrades.length === 0) {
    return {
      data,
      errors: errors.sort((left, right) => left.rowNumber - right.rowNumber),
      duplicateRows: duplicateRows.sort((left, right) => left.rowNumber - right.rowNumber),
      summary: {
        totalRows: importResult.totalRows || 0,
        importedCount: 0,
        duplicateCount: duplicateRows.length,
        rejectedCount: errors.length,
        skippedCount: duplicateRows.length + errors.length,
        createdAssetsCount: 0,
        updatedAssetsCount: 0,
      },
      fatalError: importResult.fatalError || '',
      missingColumns: importResult.missingColumns || [],
    };
  }

  const stocks = cloneStocks(existingStocks);
  const stocksBySymbol = new Map(stocks.map((stock) => [normalizeIdentifier(stock.symbol), stock]));

  acceptedTrades
    .sort((left, right) => left.rowNumber - right.rowNumber)
    .forEach((trade) => {
      let stock = stocksBySymbol.get(normalizeIdentifier(trade.symbol));
      if (!stock) {
        stock = {
          id: generateImportId(),
          symbol: trade.symbol,
          name: trade.name || trade.symbol.replace(/\.(NS|BO)$/i, ''),
          exchange: trade.exchange || inferExchange(trade.symbol, ''),
          category: 'stocks',
          transactions: [],
        };
        stocks.push(stock);
        stocksBySymbol.set(normalizeIdentifier(trade.symbol), stock);
        createdAssetsCount += 1;
      } else if (!stock.name && trade.name) {
        stock.name = trade.name;
      }

      stock.transactions.push({
        id: generateImportId(),
        type: trade.type,
        date: trade.date,
        quantity: trade.quantity,
        price: trade.price,
        amount: Number((trade.quantity * trade.price).toFixed(2)),
        notes: fileName ? `Imported from trade book: ${fileName}` : 'Imported from trade book',
        exchange: trade.exchange || stock.exchange || '',
        orderId: trade.orderId || undefined,
        tradeId: trade.tradeId || undefined,
        importFingerprint: trade.fingerprint,
        source: 'tradeBook',
      });
      updatedSymbols.add(stock.symbol);
    });

  return {
    data: { ...data, stocks },
    errors: errors.sort((left, right) => left.rowNumber - right.rowNumber),
    duplicateRows: duplicateRows.sort((left, right) => left.rowNumber - right.rowNumber),
    summary: {
      totalRows: importResult.totalRows || 0,
      importedCount: acceptedTrades.length,
      duplicateCount: duplicateRows.length,
      rejectedCount: errors.length,
      skippedCount: duplicateRows.length + errors.length,
      createdAssetsCount,
      updatedAssetsCount: updatedSymbols.size,
    },
    fatalError: importResult.fatalError || '',
    missingColumns: importResult.missingColumns || [],
  };
}
