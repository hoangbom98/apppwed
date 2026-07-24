// frontend/admin-dashboard/src/modules/shared/components/Toast.tsx
// Global toast notification system — provider + hook.
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

type PushFn = (msg: string, type?: ToastType, duration?: number) => void;

const ToastContext = createContext<PushFn | null>(null);

let _toastId = 0;

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={16} className="text-green-400 flex-shrink-0" />,
  error:   <XCircle    size={16} className="text-red-400   flex-shrink-0" />,
  warning: <AlertCircle size={16} className="text-yellow-400 flex-shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-gray-900 border-green-700',
  error:   'bg-gray-900 border-red-700',
  warning: 'bg-gray-900 border-yellow-700',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, type: ToastType = 'success', duration = 4000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-gray-100 shadow-xl pointer-events-auto min-w-[240px] max-w-sm ${BG[t.type] ?? BG.success}`}
          >
            {ICONS[t.type]}
            <span className="flex-1">{t.msg}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-500 hover:text-gray-300 ml-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): PushFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
