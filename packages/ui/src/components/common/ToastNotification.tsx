import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps {
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 = infinite
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  message,
  duration = 3000,
  onClose,
  position = 'top-center',
}) => {
  const [visible, setVisible] = useState(true);

  const config = {
    success: { icon: CheckCircle, color: '#31a24c', bg: '#e8f5e9' },
    error: { icon: AlertCircle, color: '#e41e3f', bg: '#fde8ea' },
    warning: { icon: AlertTriangle, color: '#f7b928', bg: '#fff8e1' },
    info: { icon: Info, color: '#0064e0', bg: '#e3f0ff' },
  };

  const Icon = config[type].icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`fixed z-[10000] ${position === 'top-center' ? 'top-4 left-1/2 -translate-x-1/2' : ''}
        ${position === 'top-right' ? 'top-4 right-4' : ''}
        ${position === 'bottom-right' ? 'bottom-4 right-4' : ''}
        animate-slide-down max-w-md w-full`}
    >
      <div
        className="rounded-lg shadow-lg p-4 border-l-4 flex items-start gap-3"
        style={{ backgroundColor: config[type].bg, borderColor: config[type].color }}
      >
        <Icon size={20} style={{ color: config[type].color, flexShrink: 0 }} />
        <p className="text-sm text-gray-800 flex-1">{message}</p>
        <button onClick={() => { setVisible(false); onClose?.(); }} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
