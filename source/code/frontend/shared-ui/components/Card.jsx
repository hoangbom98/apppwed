// frontend/shared-ui/components/Card.jsx
import React from 'react';

/**
 * A simple surface card.
 * @param {{ title?: string, actions?: React.ReactNode, noPadding?: boolean, className?: string }} props
 */
export default function Card({ title, actions, children, noPadding = false, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          {title && <h3 className="font-semibold text-gray-800 text-base">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
