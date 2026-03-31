import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

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
          fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-lg">
            📊
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Portfolio</div>
            <div className="text-indigo-400 text-xs font-medium">Tracker</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <div className="px-3 mb-2">
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Menu</p>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="text-base w-5 text-center">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-gray-600 text-[10px] text-center">Live Portfolio Tracker v1.0</p>
        </div>
      </aside>
    </>
  );
}
