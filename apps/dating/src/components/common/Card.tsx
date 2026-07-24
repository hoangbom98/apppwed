import React from 'react';

interface Props {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function Card({ className = '', children, onClick }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
