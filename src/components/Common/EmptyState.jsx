import React from 'react';
import Button from './Button';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-6xl mb-5 select-none">{icon}</div>
      <h3 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon="+" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
