// @ts-nocheck
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
}

const SIZES = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', fullPage = false }) => {
  const spinner = (
    <svg className={`animate-spin text-primary dark:text-accent ${SIZES[size]} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark">
        {spinner}
      </div>
    );
  }
  return spinner;
};

export default LoadingSpinner;
