import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const VARIANTS: Record<string, string> = {
  primary:   'bg-primary text-white hover:bg-secondary focus:ring-primary',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-400',
  accent:    'bg-accent text-dark hover:bg-yellow-400 focus:ring-yellow-400',
  danger:    'bg-danger text-white hover:bg-red-600 focus:ring-red-400',
  outline:   'border-2 border-primary text-primary hover:bg-primary hover:text-white dark:border-accent dark:text-accent dark:hover:bg-accent dark:hover:text-dark focus:ring-primary',
  ghost:     'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-400',
};
const SIZES: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md',
  className = '', isLoading = false, disabled, ...rest
}) => (
  <button
    disabled={disabled || isLoading}
    className={[
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed',
      VARIANTS[variant],
      SIZES[size],
      className,
    ].join(' ')}
    {...rest}
  >
    {isLoading && (
      <svg className="animate-spin h-4 w-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {children}
  </button>
);

export default Button;
