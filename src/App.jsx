import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import { ToastProvider } from './contexts/ToastContext';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import ToastContainer from './components/Common/ToastContainer';
import Breadcrumbs from './components/Common/Breadcrumbs';
import HelpModal from './components/Common/HelpModal';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import USStocks from './pages/USStocks';
import MutualFunds from './pages/MutualFunds';
import FixedDeposits from './pages/FixedDeposits';
import GoldSilver from './pages/GoldSilver';
import Cash from './pages/Cash';
import RealEstate from './pages/RealEstate';
import Others from './pages/Others';
import Settings from './pages/Settings';
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import TaxLossHarvesting from './pages/reports/TaxLossHarvesting';
import CapitalGains from './pages/reports/CapitalGains';
import Dividends from './pages/reports/Dividends';

const PAGE_TITLES = {
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

const NAV_ROUTES = ['/', '/stocks', '/us-stocks', '/mutual-funds', '/fixed-deposits', '/gold-silver', '/cash', '/real-estate', '/others', '/watchlist', '/alerts', '/reports/tax-loss-harvesting', '/reports/capital-gains', '/reports/dividends', '/settings'];

function AppLayout({ isDark, toggleDark }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] || 'Portfolio Tracker';

  const currentRouteIdx = NAV_ROUTES.indexOf(location.pathname);

  useKeyboardShortcuts([
    { key: 'j', handler: () => navigate(currentRouteIdx < NAV_ROUTES.length - 1 ? NAV_ROUTES[currentRouteIdx + 1] : NAV_ROUTES[0]), description: 'Navigate to next page' },
    { key: 'k', handler: () => navigate(currentRouteIdx > 0 ? NAV_ROUTES[currentRouteIdx - 1] : NAV_ROUTES[NAV_ROUTES.length - 1]), description: 'Navigate to previous page' },
    { key: 'g', handler: () => navigate('/'), description: 'Go to dashboard' },
  ]);

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setHelpOpen(true);
      }
      if (e.key === 'Escape') setHelpOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">Skip to content</a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDark={isDark} onToggleDark={toggleDark} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} isDark={isDark} onToggleDark={toggleDark} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin bg-gray-50 dark:bg-gray-900" tabIndex={-1}>
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/us-stocks" element={<USStocks />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/fixed-deposits" element={<FixedDeposits />} />
            <Route path="/gold-silver" element={<GoldSilver />} />
            <Route path="/cash" element={<Cash />} />
            <Route path="/real-estate" element={<RealEstate />} />
            <Route path="/others" element={<Others />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports/tax-loss-harvesting" element={<TaxLossHarvesting />} />
            <Route path="/reports/capital-gains" element={<CapitalGains />} />
            <Route path="/reports/dividends" element={<Dividends />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="bottom-right" />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default function App() {
  const { isDark, toggle } = useDarkMode();

  return (
    <HashRouter>
      <PortfolioProvider>
        <ToastProvider>
          <AppLayout isDark={isDark} toggleDark={toggle} />
        </ToastProvider>
      </PortfolioProvider>
    </HashRouter>
  );
}
