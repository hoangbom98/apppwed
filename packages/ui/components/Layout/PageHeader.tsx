// @ts-nocheck
// frontend/shared-ui/components/Layout/PageHeader.jsx
import React from 'react';

/**
 * Consistent page title bar with optional breadcrumbs and action slot.
 * @param {{ title: string, subtitle?: string, actions?: React.ReactNode, breadcrumbs?: Array<{label: string, href?: string}> }} props
 */
export default function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.href
                ? <a href={crumb.href} className="hover:text-blue-600 transition-colors">{crumb.label}</a>
                : <span className="text-gray-800 font-medium">{crumb.label}</span>
              }
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
