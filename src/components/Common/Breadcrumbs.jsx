import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePortfolio } from '../../context/PortfolioContext';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/stocks': 'Indian Stocks',
  '/us-stocks': 'US Stocks',
  '/mutual-funds': 'Mutual Funds',
  '/fixed-deposits': 'Fixed Deposits',
  '/gold-silver': 'Gold & Silver',
  '/cash': 'Cash',
  '/real-estate': 'Real Estate',
  '/others': 'Others',
  '/watchlist': 'Watchlist',
  '/alerts': 'Price Alerts',
  '/reports/tax-loss-harvesting': 'Tax Loss Harvesting',
  '/reports/capital-gains': 'Capital Gains',
  '/reports/dividends': 'Dividends',
  '/settings': 'Settings',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const { activePortfolioName } = usePortfolio();

  if (pathname === '/') return null;

  const crumbs = [
    { label: 'Dashboard', path: '/' },
    { label: ROUTE_LABELS[pathname] || pathname, path: pathname },
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-4">
      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{activePortfolioName}</span>
      <ChevronRight className="w-3 h-3 shrink-0" />
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.path}>
          {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
          {i === crumbs.length - 1 ? (
            <span className="text-gray-700 dark:text-gray-300 font-medium" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
