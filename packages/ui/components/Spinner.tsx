// @ts-nocheck
// frontend/shared-ui/components/Spinner.jsx
import React from 'react';

/**
 * @param {{ size?: 'sm'|'md'|'lg', className?: string }} props
 */
export default function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <svg
      className={`animate-spin text-blue-600 ${sz[size] || sz.md} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
