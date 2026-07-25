// @ts-nocheck
// frontend/shared-ui/components/Form/FormField.jsx
// Generic wrapper that renders label + any child control + error message.
import React from 'react';

/**
 * @param {{ label?: string, error?: string, required?: boolean, htmlFor?: string }} props
 */
export default function FormField({ label, error, required, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
