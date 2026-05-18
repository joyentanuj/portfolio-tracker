import React from 'react';
import Modal from '../Common/Modal';

const WIDGET_LABELS = {
  allocation: 'Portfolio Allocation',
  categoryBreakdown: 'Category Breakdown',
  sectorBreakdown: 'Sector Breakdown',
  topPerformers: 'Top Performers',
  investmentTimeline: 'Investment Timeline',
  performanceComparison: 'Performance Comparison',
  volatility: 'Volatility Indicators',
  correlation: 'Correlation Matrix',
  heatmap: 'Monthly Returns Heatmap',
  recentTx: 'Recent Transactions',
  health: 'Portfolio Health',
  goals: 'Goals Tracker',
  rebalancing: 'Rebalancing Suggestions',
  upcomingMaturities: 'Upcoming FD Maturities',
  dividendSummary: 'Dividend Summary',
};

export default function DashboardCustomizer({ isOpen, onClose, widgets, onChange }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard">
      <div className="space-y-3">
        {Object.entries(WIDGET_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <input
              type="checkbox"
              checked={Boolean(widgets[key])}
              onChange={(e) => onChange({ ...widgets, [key]: e.target.checked })}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>
        ))}
      </div>
    </Modal>
  );
}
