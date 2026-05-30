import React from 'react';

/**
 * Error message component
 * Displays error states with retry functionality
 */
export const ErrorMessage: React.FC<{
  message: string;
  onRetry: () => void;
  errorCode?: string;
}> = ({ message, onRetry, errorCode }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* Error Icon */}
      <div className="text-6xl mb-4">⚠️</div>
      
      {/* Error Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 max-w-xs">
        {message}
      </p>
      
      {/* Error Code */}
      {errorCode && (
        <div className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 px-2 py-1 rounded">
          Error: {errorCode}
        </div>
      )}
      
      {/* Retry Button */}
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
      >
        Try Again
      </button>
      
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
  );
};
