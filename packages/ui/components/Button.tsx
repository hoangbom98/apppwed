// @ts-nocheck
// frontend/shared-ui/components/Button.jsx
import React from 'react';

const VARIANTS = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 border-transparent',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent',
  danger:    'bg-red-600 text-white hover:bg-red-700 border-transparent',
  outline:   'bg-transparent text-blue-600 hover:bg-blue-50 border-blue-600',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
};

const SIZES = {
  xs:  'px-2 py-1 text-xs',
  sm:  'px-3 py-1.5 text-sm',
  md:  'px-4 py-2 text-sm',
  lg:  'px-5 py-2.5 text-base',
  xl:  'px-6 py-3 text-base',
};

/**
 * @param {{ variant?: keyof VARIANTS, size?: keyof SIZES, loading?: boolean, className?: string }} props
 */
export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${v} ${s} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
