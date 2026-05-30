import React from 'react';
import { SkeletonProps, LOADING_MESSAGES } from '../types';

/**
 * Skeleton loading component for popup
 * Provides visual feedback during data loading
 */
export const SkeletonLoader: React.FC<{
  message?: string;
  progress?: number;
}> = ({ 
  message = LOADING_MESSAGES.LOADING_DATA,
  progress 
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SkeletonBox width="w-8" height="h-8" />
          <div className="space-y-2">
            <SkeletonBox width="w-32" height="h-4" />
            <SkeletonBox width="w-24" height="h-3" />
          </div>
        </div>
        <SkeletonBox width="w-8" height="h-8" />
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <SkeletonBox width="w-16" height="h-8" />
        <SkeletonBox width="w-20" height="h-8" />
        <SkeletonBox width="w-18" height="h-8" />
      </div>

      {/* Loading Message */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-gray-600">{message}</span>
        </div>
        
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Comparison Cards Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ComparisonCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual skeleton box component
 */
const SkeletonBox: React.FC<SkeletonProps> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}) => (
  <div 
    className={`bg-gray-200 rounded animate-pulse ${width} ${height} ${className}`}
  />
);

/**
 * Skeleton for comparison card
 */
const ComparisonCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    {/* Platform Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <SkeletonBox width="w-8" height="h-8" />
        <div className="space-y-1">
          <SkeletonBox width="w-20" height="h-4" />
          <SkeletonBox width="w-16" height="h-3" />
        </div>
      </div>
      <SkeletonBox width="w-16" height="h-6" />
    </div>

    {/* Price Breakdown */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <SkeletonBox width="w-16" height="h-3" />
        <SkeletonBox width="w-12" height="h-3" />
      </div>
      <div className="flex justify-between">
        <SkeletonBox width="w-20" height="h-3" />
        <SkeletonBox width="w-10" height="h-3" />
      </div>
      <div className="flex justify-between">
        <SkeletonBox width="w-18" height="h-3" />
        <SkeletonBox width="w-8" height="h-3" />
      </div>
      <div className="border-t pt-2">
        <div className="flex justify-between">
          <SkeletonBox width="w-12" height="h-4" />
          <SkeletonBox width="w-16" height="h-4" />
        </div>
      </div>
    </div>

    {/* Action Button */}
    <SkeletonBox width="w-full" height="h-8" />
  </div>
);

/**
 * Skeleton for gas calculation
 */
export const GasCalculationSkeleton: React.FC = () => (
  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
    <div className="flex items-center space-x-2">
      <SkeletonBox width="w-4" height="h-4" />
      <SkeletonBox width="w-32" height="h-4" />
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <SkeletonBox width="w-16" height="h-3" />
        <SkeletonBox width="w-20" height="h-4" />
      </div>
      <div className="space-y-2">
        <SkeletonBox width="w-18" height="h-3" />
        <SkeletonBox width="w-16" height="h-4" />
      </div>
    </div>
    
    <div className="border-t pt-2">
      <div className="flex justify-between">
        <SkeletonBox width="w-24" height="h-4" />
        <SkeletonBox width="w-20" height="h-4" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for table header
 */
export const TableHeaderSkeleton: React.FC = () => (
  <div className="bg-gray-50 rounded-t-lg p-3">
    <div className="grid grid-cols-4 gap-4">
      <SkeletonBox width="w-20" height="h-4" />
      <SkeletonBox width="w-16" height="h-4" />
      <SkeletonBox width="w-18" height="h-4" />
      <SkeletonBox width="w-14" height="h-4" />
    </div>
  </div>
);

/**
 * Skeleton for table row
 */
export const TableRowSkeleton: React.FC = () => (
  <div className="bg-white border-b border-gray-200 p-3">
    <div className="grid grid-cols-4 gap-4 items-center">
      <div className="flex items-center space-x-2">
        <SkeletonBox width="w-6" height="h-6" />
        <SkeletonBox width="w-16" height="h-4" />
      </div>
      <SkeletonBox width="w-12" height="h-4" />
      <SkeletonBox width="w-14" height="h-4" />
      <SkeletonBox width="w-16" height="h-6" />
    </div>
  </div>
);
