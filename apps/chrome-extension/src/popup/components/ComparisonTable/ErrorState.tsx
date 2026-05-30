import React from 'react';

/**
 * Error state component for comparison table
 */
export const ErrorState: React.FC<{ 
  error: string; 
  className?: string;
  onRetry?: () => void;
}> = ({ error, className = '', onRetry }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      role="alert"
      aria-label="Error loading comparison data"
    >
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {/* Error Icon */}
        <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
        
        {/* Error Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Comparison
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 max-w-xs">
          {error}
        </p>
        
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading comparison data"
          >
            Try Again
          </button>
        )}
        
        {/* Additional Help */}
        <div className="mt-4 text-xs text-gray-500">
          <p>If the problem persists, try:</p>
          <ul className="mt-1 space-y-1">
            <li>• Refreshing the page</li>
            <li>• Checking your internet connection</li>
            <li>• Opening the extension settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
