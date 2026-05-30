import React from 'react';

/**
 * Loading state component for gas calculator
 */
export const LoadingState: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header Skeleton */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-200 rounded animate-pulse" />
            <div className="h-5 bg-blue-200 rounded w-32 animate-pulse" />
          </div>
          <div className="h-6 bg-blue-200 rounded w-20 animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-4">
        {/* Route Info Skeleton */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Gas Breakdown Skeleton */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-28 mb-3 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* MPG Editor Skeleton */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="h-4 bg-yellow-200 rounded w-32 mb-3 animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 bg-yellow-200 rounded w-full animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-8 bg-yellow-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Savings Display Skeleton */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse" />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
