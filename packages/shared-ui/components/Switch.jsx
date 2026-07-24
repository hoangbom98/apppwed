import React from 'react';

/**
 * Switch — toggle switch input
 * Usage: <Switch checked={enabled} onChange={setEnabled} label="Notifications" />
 */
export default function Switch({ checked, onChange, label, disabled = false, size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-4' : size === 'lg' ? 'w-14 h-7' : 'w-11 h-6';
  const thumbSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const translate  = size === 'sm' ? 'translate-x-4' : size === 'lg' ? 'translate-x-7' : 'translate-x-5';

  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`relative inline-flex ${sizeClass} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span
          className={`${thumbSize} bg-white rounded-full shadow transform transition-transform ${checked ? translate : 'translate-x-1'}`}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
