// @ts-nocheck
// frontend/shared-ui/components/Form/Textarea.jsx
import React from 'react';

/**
 * @param {{ label?: string, error?: string, rows?: number, className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>} props
 */
export default function Textarea({ label, error, rows = 4, className = '', id, ...rest }) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={[
          'block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 outline-none transition resize-y',
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
