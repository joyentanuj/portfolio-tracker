# Live Portfolio Tracker

A professional dark-themed portfolio tracker built with React 18 + Vite + Tailwind CSS, inspired by Zerodha/Groww.

## Features

- **Dashboard** — Total value, invested amount, P&L, overall XIRR, allocation pie chart, top gainers/losers
- **Live Prices** — Yahoo Finance (stocks), MFAPI.in (mutual funds), goldprice.org (metals), auto-refresh every 60s
- **8 Asset Categories** — Stocks (Indian & US), Mutual Funds, Fixed Deposits, Gold, Silver, Cash, Real Estate, Others
- **XIRR Calculation** — Newton-Raphson method per asset, per category, and overall portfolio
- **Transaction Management** — Buy/sell transactions with full CRUD
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
3. Return to the Dashboard to see your live portfolio summary, allocation chart, and XIRR.
4. Use **Settings** to configure auto-refresh, export a JSON backup, or import one.

## Notes

- Stock symbols for NSE: `RELIANCE.NS`, for BSE: `RELIANCE.BO`, for US: `AAPL`
- Mutual fund scheme codes are from [mfapi.in](https://mfapi.in) (e.g. `120503`)
- Gold/Silver prices are fetched from goldprice.org; a static fallback is used if the API is unavailable
