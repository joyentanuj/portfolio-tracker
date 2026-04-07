import React from 'react';
import Button from './Button';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const isStringIcon = typeof icon === 'string';
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center mb-5 text-gray-400 dark:text-gray-500">
        {isStringIcon
          ? <span className="text-3xl select-none">{icon}</span>
          : <span className="[&>svg]:w-8 [&>svg]:h-8">{icon}</span>
        }
      </div>
      <h3 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
