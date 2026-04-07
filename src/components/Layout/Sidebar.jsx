import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, X, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_LINKS } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose, isDark, onToggleDark }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30
          flex flex-col transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-5 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-gray-900 dark:text-gray-100 font-bold text-sm leading-none">Portfolio</div>
              <div className="text-indigo-400 text-xs font-medium">Tracker</div>
            </div>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 lg:hidden shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <div className="px-2 mb-2">
            {!collapsed && (
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Menu</p>
            )}
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className="shrink-0 flex items-center justify-center w-4 h-4">{link.icon}</span>
                {!collapsed && link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          {!collapsed && (
            <p className="text-gray-400 dark:text-gray-500 text-[10px] truncate">Live Portfolio Tracker v1.0</p>
          )}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              onClick={onToggleDark}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1.5 rounded"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1.5 rounded"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
