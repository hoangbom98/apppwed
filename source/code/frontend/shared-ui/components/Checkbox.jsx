import React from 'react';

/**
 * Checkbox — controlled checkbox with label
 * Usage: <Checkbox checked={val} onChange={setVal} label="Remember me" />
 */
export default function Checkbox({ checked, onChange, label, disabled = false, id, className = '' }) {
  const inputId = id || `checkbox-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
