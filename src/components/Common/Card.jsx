import React from 'react';

export default function Card({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="text-gray-900 font-semibold text-sm">{title}</h3>}
            {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
