// @ts-nocheck
import React from 'react';

/**
 * Breadcrumb — hierarchical navigation indicator
 * Usage: <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />
 */
export default function Breadcrumb({ items = [], separator = '/', className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1 text-sm ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className="text-gray-400 select-none" aria-hidden="true">{separator}</span>
            )}
            {isLast || !item.href ? (
              <span className={`${isLast ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-primary hover:underline"
              >
                {item.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
