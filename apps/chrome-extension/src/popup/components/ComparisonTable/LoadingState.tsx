import React from 'react';

/**
 * Loading state component for comparison table
 */
export const LoadingState: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      role="status"
      aria-label="Loading comparison data"
    >
      {/* Header Skeleton */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-5 gap-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Rows Skeleton */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 p-4">
            {/* Platform Column */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            </div>

            {/* Price Columns */}
            <div className="flex items-center">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="flex items-center">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>

            {/* Time Column */}
            <div className="flex items-center">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
            </div>

            {/* Status Column */}
            <div className="flex items-center">
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
