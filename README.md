# Live Portfolio Tracker

A professional dark-themed portfolio tracker built with React 18 + Vite + Tailwind CSS, inspired by Zerodha/Groww.

## Features

- **Dashboard** — Total value, invested amount, P&L, overall XIRR, allocation pie chart, top gainers/losers
- **Live Prices** — Yahoo Finance (stocks & metals), MFAPI.in (mutual funds), auto-refresh every 60s
- **8 Asset Categories** — Stocks (Indian & US), Mutual Funds, Fixed Deposits, Gold, Silver, Cash, Real Estate, Others
- **XIRR Calculation** — Newton-Raphson method per asset, per category, and overall portfolio
- **Transaction Management** — Buy/sell transactions with full CRUD
- **Excel Trade Book Import** — Upload `.xlsx` / `.xls` stock trade books and merge validated trades into existing holdings
- **Data Persistence** — All data stored in browser localStorage; no server required
- **Export / Import** — JSON backup and restore in Settings
- **INR Formatting** — ₹1,23,456.78 throughout; green for profit, red for loss

## Tech Stack

- React 18 + Vite
- Tailwind CSS (dark theme)
- React Router v6
- Recharts (pie chart)
- date-fns

## Getting Started

```bash
npm install
npm run dev     # development server at http://localhost:5173
npm run build   # production build
```

## Usage

1. Open the app and navigate to any asset category page (e.g. Stocks, Mutual Funds).
2. Click **Add** to add an asset, then use **Txns** to record buy/sell transactions.
3. On **Indian Stocks**, use **Import stock trade book** to upload a broker Excel file and merge buy/sell transactions into your holdings.
4. Return to the Dashboard to see your live portfolio summary, allocation chart, and XIRR.
5. Use **Settings** to configure auto-refresh, export a JSON backup, or import one.

## Excel Trade Book Import

- Open **Indian Stocks** and upload a broker trade book in `.xlsx` or `.xls` format.
- Header matching is case-insensitive and supports common aliases, including:
  - Symbol: `Symbol`, `Stock`, `Scrip`
  - Side: `Buy/Sell`, `Side`
  - Quantity: `Qty`, `Quantity`
  - Price: `Rate`, `Price`
  - Optional metadata: `Trade Date`, `Exchange`, `Order ID`, `Trade ID`, `Stock Name`, `ISIN`
- Required columns are symbol/stock identifier, buy-or-sell side, quantity, and trade price.
- `ISIN` headers are recognized for validation, but each imported row still needs a tradable symbol/ticker because holdings are tracked by stock symbol.
- Invalid rows are rejected with row-level errors. Quantity and price must be positive, side must be buy/sell, and sells that exceed currently held quantity are blocked.
- Imports never replace your existing manual holdings. Valid rows are merged in as stock transactions and the holdings screen refreshes immediately.
- Duplicate trades are skipped automatically. The importer prefers `Trade ID` / `Order ID` when present and falls back to a stable fingerprint of symbol, date, side, quantity, price, and exchange when identifiers are missing.

## Notes

- Stock symbols for NSE: `RELIANCE.NS`, for BSE: `RELIANCE.BO`, for US: `AAPL`
- Mutual fund scheme codes are from [mfapi.in](https://mfapi.in) (e.g. `120503`)
- Gold/Silver prices are fetched from Yahoo Finance (`GC=F`, `SI=F`) with USD/INR conversion via `USDINR=X`; MCX ETF proxies (GOLDBEES.NS, SILVERIETF.NS) are used as fallback if Yahoo Finance is unavailable
