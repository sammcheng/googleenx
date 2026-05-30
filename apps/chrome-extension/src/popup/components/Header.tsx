import React from 'react';

/**
 * Header component for popup
 * Shows title, refresh button, and total savings
 */
export const Header: React.FC<{
  onRefresh: () => void;
  isLoading: boolean;
  totalSavings: number;
}> = ({ onRefresh, isLoading, totalSavings }) => {
  const formatSavings = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Title and Icon */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Price Comparison
            </h1>
            <p className="text-sm text-gray-600">
              Find the best deals
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Total Savings */}
          {totalSavings > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-600">Total Savings</div>
              <div className="text-sm font-semibold text-green-600">
                {formatSavings(totalSavings)}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`
              p-2 rounded-lg transition-colors duration-200
              ${isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }
            `}
            title="Refresh comparison"
          >
            <div className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
