// frontend/shared-ui/components/Form/Select.jsx
import React from 'react';

/**
 * @param {{ label?: string, error?: string, options: Array<{value: string|number, label: string}>, className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>} props
 */
export default function Select({ label, error, options = [], className = '', id, children, ...rest }) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          'block w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none transition',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400',
          className,
        ].join(' ')}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
