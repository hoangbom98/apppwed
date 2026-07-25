import React from 'react';

/**
 * Rating — star rating display / interactive picker
 * Usage (read-only): <Rating value={4.5} max={5} />
 * Usage (interactive): <Rating value={rating} max={5} onChange={setRating} />
 */
export default function Rating({ value = 0, max = 5, onChange, size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  const interactive = typeof onChange === 'function';

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(value);
        const half   = !filled && i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(i + 1)}
            className={`focus:outline-none ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <svg
              className={`${sizeClass} ${filled || half ? 'text-yellow-400' : 'text-gray-300'}`}
              fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
