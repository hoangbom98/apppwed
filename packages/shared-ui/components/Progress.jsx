import React from 'react';

/**
 * Progress — linear progress bar
 * Usage: <Progress value={65} max={100} label="Uploading..." />
 */
export default function Progress({
  value = 0,
  max = 100,
  label,
  showPercent = false,
  color = 'primary',
  size = 'md',
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';
  const colorClass = {
    primary: 'bg-primary',
    green:   'bg-green-500',
    yellow:  'bg-yellow-400',
    red:     'bg-red-500',
    blue:    'bg-blue-500',
  }[color] || 'bg-primary';

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-600">{label}</span>}
          {showPercent && <span className="text-xs text-gray-500">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClass}`}>
        <div
          className={`${sizeClass} ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
