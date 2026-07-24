import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function BottomSheet({ isOpen, onClose, title, children, className = '' }: Props) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up ${className}`}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          {title && <h3 className="font-semibold text-base text-gray-900">{title}</h3>}
          <button onClick={onClose} className="ml-auto p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-8 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
