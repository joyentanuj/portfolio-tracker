import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from '@e965/xlsx';
import {
  parseTradeBookRows,
  parseTradeBookWorkbook,
  mergeTradeBookRowsIntoPortfolio,
} from './tradeBookImport.js';

function makeWorkbookBuffer(rows, bookType = 'xlsx') {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');
  return XLSX.write(workbook, { type: 'buffer', bookType });
}

test('parseTradeBookRows normalizes common header aliases', () => {
  const result = parseTradeBookRows([
    ['Scrip', 'Buy/Sell', 'Qty', 'Rate', 'Trade Date', 'Exchange', 'Order No'],
    ['RELIANCE', 'BUY', '10', '2450.5', '28/09/2026', 'NSE', 'ORD-1'],
  ]);

  assert.equal(result.fatalError, '');
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0], {
    rowNumber: 2,
    symbol: 'RELIANCE.NS',
    name: '',
    type: 'buy',
    quantity: 10,
    price: 2450.5,
    date: '2026-09-28',
    exchange: 'NSE',
    orderId: 'ORD-1',
    tradeId: '',
    fingerprint: result.rows[0].fingerprint,
  });
  assert.match(result.rows[0].fingerprint, /^id\|ORD-1/i);
});

test('parseTradeBookWorkbook reads xlsx and xls workbooks', () => {
  const rows = [
    ['Symbol', 'Side', 'Quantity', 'Price'],
    ['INFY', 'Buy', 5, 1500],
  ];

  const xlsxResult = parseTradeBookWorkbook(makeWorkbookBuffer(rows, 'xlsx'));
  const xlsResult = parseTradeBookWorkbook(makeWorkbookBuffer(rows, 'biff8'));

  assert.equal(xlsxResult.rows.length, 1);
  assert.equal(xlsResult.rows.length, 1);
  assert.equal(xlsxResult.rows[0].symbol, 'INFY');
  assert.equal(xlsResult.rows[0].symbol, 'INFY');
});

test('parseTradeBookRows reports row-level validation errors and missing required headers', () => {
  const missingHeaderResult = parseTradeBookRows([
    ['Symbol', 'Qty', 'Trade Date'],
    ['TCS', '3', '2026-09-28'],
  ]);

  assert.equal(missingHeaderResult.fatalError, 'Missing required columns: Buy/Sell, Rate.');
  assert.deepEqual(missingHeaderResult.missingColumns, ['type', 'price']);

  const rowErrorResult = parseTradeBookRows([
    ['Symbol', 'Side', 'Qty', 'Price', 'Trade Date'],
    ['', 'BUY', '10', '100', '2026-09-28'],
    ['SBIN', 'HOLD', '-1', '0', 'not-a-date'],
  ]);

  assert.equal(rowErrorResult.rows.length, 0);
  assert.equal(rowErrorResult.errors.length, 2);
  assert.match(rowErrorResult.errors[0].message, /Missing a usable symbol/);
  assert.match(rowErrorResult.errors[1].message, /Transaction type must be buy or sell/);
  assert.match(rowErrorResult.errors[1].message, /Quantity must be a positive number/);
  assert.match(rowErrorResult.errors[1].message, /Trade price must be a positive number/);
  assert.match(rowErrorResult.errors[1].message, /Trade date is invalid/);
});

test('mergeTradeBookRowsIntoPortfolio imports buys and sells, skips duplicates, and blocks oversells', () => {
  const portfolio = {
    settings: { autoRefresh: true, refreshInterval: 60 },
    stocks: [
      {
        id: 'stock-1',
        symbol: 'RELIANCE.NS',
        name: 'Reliance',
        exchange: 'NSE',
        category: 'stocks',
        transactions: [
          { id: 'tx-1', type: 'buy', date: '2026-09-20', quantity: 10, price: 100, amount: 1000, orderId: 'OLD-1' },
        ],
      },
    ],
  };

  const parsedImport = parseTradeBookRows([
    ['Symbol', 'Side', 'Qty', 'Price', 'Trade Date', 'Exchange', 'Order ID'],
    ['RELIANCE', 'BUY', '5', '110', '2026-09-21', 'NSE', 'OLD-1'],
    ['RELIANCE', 'BUY', '5', '110', '2026-09-21', 'NSE', 'NEW-1'],
    ['RELIANCE', 'SELL', '8', '120', '2026-09-22', 'NSE', 'NEW-2'],
    ['RELIANCE', 'SELL', '20', '125', '2026-09-23', 'NSE', 'NEW-3'],
  ]);

  const merged = mergeTradeBookRowsIntoPortfolio(portfolio, parsedImport, 'tradebook.xlsx');
  const stock = merged.data.stocks[0];

  assert.equal(merged.summary.importedCount, 2);
  assert.equal(merged.summary.duplicateCount, 1);
  assert.equal(merged.summary.rejectedCount, 1);
  assert.equal(stock.transactions.length, 3);
  assert.equal(stock.transactions[1].type, 'buy');
  assert.equal(stock.transactions[2].type, 'sell');
  assert.equal(stock.transactions[1].notes, 'Imported from trade book: tradebook.xlsx');
  assert.match(merged.errors[0].message, /Cannot sell 20 units/);
});

test('mergeTradeBookRowsIntoPortfolio preserves manual holdings and creates new stock assets', () => {
  const portfolio = {
    settings: { autoRefresh: false, refreshInterval: 120 },
    mutualFunds: [{ id: 'mf-1', schemeCode: '120465', schemeName: 'Axis Large Cap Fund' }],
    stocks: [
      {
        id: 'stock-1',
        symbol: 'TCS.NS',
        name: 'TCS',
        exchange: 'NSE',
        category: 'stocks',
        transactions: [
          { id: 'tx-1', type: 'buy', date: '2026-09-20', quantity: 2, price: 3500, amount: 7000 },
        ],
      },
    ],
  };

  const parsedImport = parseTradeBookRows([
    ['Stock', 'Side', 'Quantity', 'Trade Price', 'Trade Date', 'Exchange', 'Stock Name'],
    ['INFY', 'Buy', '4', '1550', '2026-09-25', 'NSE', 'Infosys Ltd'],
  ]);

  const merged = mergeTradeBookRowsIntoPortfolio(portfolio, parsedImport);

  assert.equal(merged.summary.importedCount, 1);
  assert.equal(merged.summary.createdAssetsCount, 1);
  assert.equal(merged.data.settings.autoRefresh, false);
  assert.equal(merged.data.mutualFunds.length, 1);
  assert.equal(merged.data.stocks.length, 2);
  const infy = merged.data.stocks.find((stock) => stock.symbol === 'INFY.NS');
  assert.ok(infy);
  assert.equal(infy.name, 'Infosys Ltd');
  assert.equal(infy.transactions.length, 1);
  assert.equal(merged.data.stocks.find((stock) => stock.symbol === 'TCS.NS').transactions.length, 1);
});
