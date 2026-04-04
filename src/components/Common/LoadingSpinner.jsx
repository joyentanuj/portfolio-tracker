import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size] || 'w-8 h-8';
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${s} border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin`} />
    </div>
  );
}
