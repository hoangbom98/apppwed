import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary:   'bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500 shadow-pink-200 shadow-md',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  outline:   'border border-pink-400 text-pink-500 hover:bg-pink-50',
  ghost:     'text-gray-600 hover:bg-gray-100',
  danger:    'bg-red-500 text-white hover:bg-red-600',
};
const sizes = {
  sm:  'px-3 py-1.5 text-xs rounded-lg',
  md:  'px-4 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3 text-base rounded-2xl',
};

export default function Button({
  variant = 'primary', size = 'md', loading = false, fullWidth = false,
  children, className = '', disabled, ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        font-semibold transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-2
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
