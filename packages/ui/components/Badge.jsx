// frontend/shared-ui/components/Badge.jsx
import React from 'react';

const COLORS = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  purple:  'bg-purple-100 text-purple-700',
};

/**
 * @param {{ variant?: keyof COLORS, className?: string }} props
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[variant] || COLORS.default} ${className}`}>
      {children}
    </span>
  );
}
