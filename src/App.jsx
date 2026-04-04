import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import Toast from './components/Common/Toast';

import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import MutualFunds from './pages/MutualFunds';
import FixedDeposits from './pages/FixedDeposits';
import GoldSilver from './pages/GoldSilver';
import Cash from './pages/Cash';
import RealEstate from './pages/RealEstate';
import Others from './pages/Others';
import Settings from './pages/Settings';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/stocks': 'Stocks',
  '/mutual-funds': 'Mutual Funds',
  '/fixed-deposits': 'Fixed Deposits',
  '/gold-silver': 'Gold & Silver',
  '/cash': 'Cash',
  '/real-estate': 'Real Estate',
  '/others': 'Others',
  '/settings': 'Settings',
};

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Portfolio Tracker';

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/fixed-deposits" element={<FixedDeposits />} />
            <Route path="/gold-silver" element={<GoldSilver />} />
            <Route path="/cash" element={<Cash />} />
            <Route path="/real-estate" element={<RealEstate />} />
            <Route path="/others" element={<Others />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PortfolioProvider>
        <AppLayout />
      </PortfolioProvider>
    </BrowserRouter>
  );
}
