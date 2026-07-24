// frontend/shared-ui/components/Pagination.jsx
import React from 'react';

/**
 * @param {{ page: number, totalPages: number, onPageChange: (p: number) => void }} props
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left  = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  if (left > 1)  { pages.push(1); if (left > 2) pages.push('...'); }
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }

  const btn = (key, label, active, disabled, onClick) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm border transition-colors',
        active   ? 'bg-blue-600 border-blue-600 text-white'              : '',
        !active && !disabled ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : '',
        disabled ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      {btn('prev', '←', false, page === 1, () => onPageChange(page - 1))}
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} className="px-2 text-gray-400 select-none">…</span>
          : btn(p, p, p === page, false, () => onPageChange(p))
      )}
      {btn('next', '→', false, page === totalPages, () => onPageChange(page + 1))}
    </nav>
  );
}
