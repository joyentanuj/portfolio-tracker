import React from 'react';
import {
  TrendingUp,
  Globe,
  Building2,
  Landmark,
  Medal,
  Coins,
  Banknote,
  Home,
  Package,
  LayoutDashboard,
  Settings2,
  Shield,
  HardHat,
} from 'lucide-react';

export const ASSET_CATEGORIES = {
  STOCKS: 'stocks',
  US_STOCKS: 'usStocks',
  MUTUAL_FUNDS: 'mutualFunds',
  FIXED_DEPOSITS: 'fixedDeposits',
  PPF: 'ppf',
  EPFO: 'epfo',
  GOLD: 'gold',
  SILVER: 'silver',
  CASH: 'cash',
  REAL_ESTATE: 'realEstate',
  OTHERS: 'others',
};

export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
};

export const CATEGORY_COLORS = {
  stocks: '#6366f1',
  usStocks: '#3b82f6',
  mutualFunds: '#8b5cf6',
  fixedDeposits: '#06b6d4',
  ppf: '#10b981',
  epfo: '#0ea5e9',
  gold: '#f59e0b',
  silver: '#94a3b8',
  cash: '#22c55e',
  realEstate: '#f97316',
  others: '#ec4899',
};

export const CATEGORY_LABELS = {
  stocks: 'Indian Stocks',
  usStocks: 'US Stocks',
  mutualFunds: 'Mutual Funds',
  fixedDeposits: 'Fixed Deposits',
  ppf: 'PPF',
  epfo: 'EPFO / EPF',
  gold: 'Gold',
  silver: 'Silver',
  cash: 'Cash',
  realEstate: 'Real Estate',
  others: 'Others',
};

export const CATEGORY_ICONS = {
  stocks: <TrendingUp className="w-4 h-4" />,
  usStocks: <Globe className="w-4 h-4" />,
  mutualFunds: <Building2 className="w-4 h-4" />,
  fixedDeposits: <Landmark className="w-4 h-4" />,
  ppf: <Shield className="w-4 h-4" />,
  epfo: <HardHat className="w-4 h-4" />,
  gold: <Medal className="w-4 h-4" />,
  silver: <Coins className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  realEstate: <Home className="w-4 h-4" />,
  others: <Package className="w-4 h-4" />,
};

export const NAV_LINKS = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { path: '/stocks', label: 'Indian Stocks', icon: <TrendingUp className="w-4 h-4" /> },
  { path: '/us-stocks', label: 'US Stocks', icon: <Globe className="w-4 h-4" /> },
  { path: '/mutual-funds', label: 'Mutual Funds', icon: <Building2 className="w-4 h-4" /> },
  { path: '/fixed-deposits', label: 'Fixed Deposits', icon: <Landmark className="w-4 h-4" /> },
  { path: '/gold-silver', label: 'Gold & Silver', icon: <Medal className="w-4 h-4" /> },
  { path: '/cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  { path: '/real-estate', label: 'Real Estate', icon: <Home className="w-4 h-4" /> },
  { path: '/others', label: 'Others', icon: <Package className="w-4 h-4" /> },
  { path: '/settings', label: 'Settings', icon: <Settings2 className="w-4 h-4" /> },
];

export const COMPOUNDING_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'halfYearly', label: 'Half Yearly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'simple', label: 'Simple Interest' },
];
