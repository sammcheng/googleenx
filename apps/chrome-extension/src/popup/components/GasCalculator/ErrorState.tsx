import React from 'react';

/**
 * Error state component for gas calculator
 */
export const ErrorState: React.FC<{ 
  error: string; 
  className?: string;
  onRetry?: () => void;
}> = ({ error, className = '', onRetry }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {/* Error Icon */}
        <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
        
        {/* Error Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Calculate Gas Cost
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 max-w-xs">
          {error}
        </p>
        
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            aria-label="Retry gas calculation"
          >
            Try Again
          </button>
        )}
        
        {/* Additional Help */}
        <div className="mt-4 text-xs text-gray-500">
          <p>If the problem persists, try:</p>
          <ul className="mt-1 space-y-1">
            <li>• Checking your internet connection</li>
            <li>• Refreshing the page</li>
            <li>• Updating your MPG settings</li>
            <li>• Contacting support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
