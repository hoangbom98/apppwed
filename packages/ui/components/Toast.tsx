// @ts-nocheck
// frontend/shared-ui/components/Toast.jsx
// Render this once at the app root alongside the useToast hook.
// Usage:
//   const { toasts, toast, remove } = useToast();
//   <Toast toasts={toasts} onRemove={remove} />
import React from 'react';

const STYLES = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error:   'bg-red-50   border-red-400   text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info:    'bg-blue-50  border-blue-400  text-blue-800',
};

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

/**
 * @param {{ toasts: Array<{id: number, type: string, message: string}>, onRemove: (id: number) => void }} props
 */
export default function Toast({ toasts = [], onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md pointer-events-auto ${STYLES[t.type] || STYLES.info}`}
        >
          <span className="font-bold text-base leading-none mt-0.5">{ICONS[t.type] || 'ℹ'}</span>
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          <button
            onClick={() => onRemove?.(t.id)}
            className="shrink-0 text-current opacity-60 hover:opacity-100 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
