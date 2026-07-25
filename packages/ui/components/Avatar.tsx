// @ts-nocheck
import React from 'react';

/**
 * Avatar — user profile picture with fallback initials
 * Usage: <Avatar src={url} name="Nguyen Van A" size="md" />
 */
export default function Avatar({ src, name, size = 'md', className = '', onClick }) {
  const sizeMap = {
    xs:  'w-6 h-6 text-xs',
    sm:  'w-8 h-8 text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-14 h-14 text-base',
    xl:  'w-20 h-20 text-lg',
  };
  const sizeClass = sizeMap[size] || sizeMap.md;

  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200 font-semibold text-gray-600 select-none ${sizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
