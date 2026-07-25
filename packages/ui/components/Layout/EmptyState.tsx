// @ts-nocheck
// frontend/shared-ui/components/Layout/EmptyState.jsx
import React from 'react';

/**
 * @param {{ title?: string, description?: string, action?: React.ReactNode, icon?: React.ReactNode }} props
 */
export default function EmptyState({ title = 'No data', description, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      {!icon && (
        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 17v-2a4 4 0 018 0v2M9 7h6M9 11h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      <p className="text-base font-semibold text-gray-500">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
