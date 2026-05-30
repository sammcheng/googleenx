import React, { useState, useMemo, useCallback } from 'react';
import { 
  ComparisonTableProps, 
  PlatformData, 
  SortConfig, 
  SortableColumn 
} from './types';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

/**
 * Reusable comparison table component
 * Displays platform comparison data with sorting, highlighting, and accessibility
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  platforms,
  showPickup = false,
  onPlatformClick,
  className = '',
  sortable = true,
  highlightBest = true,
  showSavings = true,
  currency = 'USD',
  loading = false,
  error
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  /**
   * Handle column sorting
   */
  const handleSort = useCallback((column: string) => {
    if (!sortable) return;

    const sortableColumn = column as SortableColumn;
    setSortConfig(prevConfig => {
      if (!prevConfig || prevConfig.column !== sortableColumn) {
        return { column: sortableColumn, direction: 'asc' };
      }
      
      if (prevConfig.direction === 'asc') {
        return { column: sortableColumn, direction: 'desc' };
      }
      
      return null; // Remove sorting
    });
  }, [sortable]);

  /**
   * Sort platforms based on current sort configuration
   */
  const sortedPlatforms = useMemo(() => {
    if (!sortConfig) return platforms;

    return [...platforms].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortConfig.column) {
        case 'deliveryPrice':
          aValue = a.deliveryPrice;
          bValue = b.deliveryPrice;
          break;
        case 'pickupPrice':
          aValue = a.pickupPrice || 0;
          bValue = b.pickupPrice || 0;
          break;
        case 'deliveryTime':
          aValue = parseTimeToMinutes(a.deliveryTime);
          bValue = parseTimeToMinutes(b.deliveryTime);
          break;
        case 'pickupTime':
          aValue = parseTimeToMinutes(a.pickupTime || '');
          bValue = parseTimeToMinutes(b.pickupTime || '');
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }

      return 0;
    });
  }, [platforms, sortConfig]);

  /**
   * Handle platform click
   */
  const handlePlatformClick = useCallback((platform: PlatformData) => {
    if (platform.status === 'unavailable') return;
    
    if (onPlatformClick) {
      onPlatformClick(platform);
    } else {
      // Default behavior: open platform URL
      window.open(platform.url, '_blank', 'noopener,noreferrer');
    }
  }, [onPlatformClick]);

  /**
   * Parse time string to minutes for sorting
   */
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    
    // Handle formats like "25-35 min", "30 min", "1h 15m"
    const match = timeStr.match(/(\d+)(?:-(\d+))?\s*(?:min|m|h)/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2; // Average for range
    }
    
    return 0;
  };

  // Show loading state
  if (loading) {
    return <LoadingState className={className} />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} className={className} />;
  }

  // Show empty state
  if (platforms.length === 0) {
    return <EmptyState className={className} />;
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      role="table"
      aria-label="Platform comparison table"
    >
      {/* Table Header */}
      <div 
        className="bg-gray-50 border-b border-gray-200"
        role="rowgroup"
      >
        <div className="grid grid-cols-5 gap-4 p-4" role="row">
          <TableHeader
            column="platform"
            label="Platform"
            sortable={false}
            sortConfig={null}
            onSort={handleSort}
            className="font-semibold text-gray-900"
          />
          <TableHeader
            column="deliveryPrice"
            label="Delivery Price"
            sortable={sortable}
            sortConfig={sortConfig}
            onSort={handleSort}
            className="font-semibold text-gray-900"
          />
          {showPickup && (
            <TableHeader
              column="pickupPrice"
              label="Pickup Price"
              sortable={sortable}
              sortConfig={sortConfig}
              onSort={handleSort}
              className="font-semibold text-gray-900"
            />
          )}
          <TableHeader
            column="deliveryTime"
            label="Time"
            sortable={sortable}
            sortConfig={sortConfig}
            onSort={handleSort}
            className="font-semibold text-gray-900"
          />
          <TableHeader
            column="status"
            label="Status"
            sortable={false}
            sortConfig={null}
            onSort={handleSort}
            className="font-semibold text-gray-900"
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200" role="rowgroup">
        {sortedPlatforms.map((platform, index) => (
          <TableRow
            key={platform.id}
            platform={platform}
            showPickup={showPickup}
            onPlatformClick={handlePlatformClick}
            highlightBest={highlightBest}
            showSavings={showSavings}
            currency={currency}
            className={`
              transition-colors duration-200 hover:bg-gray-50
              ${platform.status === 'unavailable' ? 'opacity-50' : 'cursor-pointer'}
            `}
            role="row"
            tabIndex={platform.status === 'unavailable' ? -1 : 0}
            aria-label={`${platform.displayName} comparison row`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePlatformClick(platform);
              }
            }}
          />
        ))}
      </div>

      {/* Table Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {platforms.length} {platforms.length === 1 ? 'platform' : 'platforms'} compared
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version of the comparison table
 * Useful for smaller spaces or mobile views
 */
export const CompactComparisonTable: React.FC<ComparisonTableProps> = (props) => {
  return (
    <ComparisonTable
      {...props}
      className={`${props.className} text-sm`}
    />
  );
};

/**
 * Mobile-optimized comparison table
 * Stacks information vertically for better mobile experience
 */
export const MobileComparisonTable: React.FC<ComparisonTableProps> = ({
  platforms,
  showPickup = false,
  onPlatformClick,
  className = '',
  highlightBest = true,
  showSavings = true,
  currency = 'USD',
  loading = false,
  error
}) => {
  if (loading) {
    return <LoadingState className={className} />;
  }

  if (error) {
    return <ErrorState error={error} className={className} />;
  }

  if (platforms.length === 0) {
    return <EmptyState className={className} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {platforms.map((platform) => (
        <div
          key={platform.id}
          className={`
            bg-white rounded-lg border border-gray-200 p-4
            transition-colors duration-200
            ${platform.status === 'unavailable' ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'}
          `}
          onClick={() => {
            if (platform.status !== 'unavailable' && onPlatformClick) {
              onPlatformClick(platform);
            }
          }}
          role="button"
          tabIndex={platform.status === 'unavailable' ? -1 : 0}
          aria-label={`${platform.displayName} comparison card`}
        >
          {/* Platform Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg">{platform.logo}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{platform.displayName}</h3>
                {platform.notes && (
                  <p className="text-xs text-gray-600">{platform.notes}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              {highlightBest && platform.isBestDelivery && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🏆 Best
                </span>
              )}
            </div>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-sm text-gray-600">Delivery</div>
              <div className={`font-semibold ${platform.isBestDelivery ? 'text-green-600' : 'text-gray-900'}`}>
                {formatPrice(platform.deliveryPrice, currency)}
                {showSavings && platform.deliverySavings && platform.deliverySavings > 0 && (
                  <span className="text-xs text-green-600 ml-1">
                    (Save {formatPrice(platform.deliverySavings, currency)})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600">{platform.deliveryTime}</div>
            </div>
            
            {showPickup && platform.pickupPrice && (
              <div>
                <div className="text-sm text-gray-600">Pickup</div>
                <div className={`font-semibold ${platform.isBestPickup ? 'text-green-600' : 'text-gray-900'}`}>
                  {formatPrice(platform.pickupPrice, currency)}
                  {showSavings && platform.pickupSavings && platform.pickupSavings > 0 && (
                    <span className="text-xs text-green-600 ml-1">
                      (Save {formatPrice(platform.pickupSavings, currency)})
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">{platform.pickupTime}</div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <StatusIndicator status={platform.status} />
            {platform.status !== 'unavailable' && (
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View on Platform →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Format price with currency symbol
 */
const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency;
  return `${symbol}${price.toFixed(2)}`;
};

/**
 * Status indicator component
 */
const StatusIndicator: React.FC<{ status: PlatformData['status'] }> = ({ status }) => {
  const config = {
    available: { label: 'Available', color: 'text-green-600', bgColor: 'bg-green-100', icon: '✅' },
    unavailable: { label: 'Unavailable', color: 'text-red-600', bgColor: 'bg-red-100', icon: '❌' },
    limited: { label: 'Limited', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '⚠️' },
    error: { label: 'Error', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '❓' }
  }[status];

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};
