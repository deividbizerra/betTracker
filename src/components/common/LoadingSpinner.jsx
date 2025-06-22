import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses[size]} ${className}`} />
  );
}