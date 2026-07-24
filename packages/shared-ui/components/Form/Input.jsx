// frontend/shared-ui/components/Form/Input.jsx
import React from 'react';

/**
 * @param {{ label?: string, error?: string, className?: string } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export default function Input({ label, error, className = '', id, ...rest }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 outline-none transition',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
