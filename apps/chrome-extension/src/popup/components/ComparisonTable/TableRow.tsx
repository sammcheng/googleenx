import React from 'react';
import { TableRowProps, STATUS_CONFIG, CURRENCY_SYMBOLS } from './types';
import { PlatformLogo } from './PlatformLogo';
import { StatusIndicator } from './StatusIndicator';
import { PriceDisplay } from './PriceDisplay';
import { TimeDisplay } from './TimeDisplay';

/**
 * Table row component for platform comparison
 */
export const TableRow: React.FC<TableRowProps> = ({
  platform,
  showPickup,
  onPlatformClick,
  highlightBest,
  showSavings,
  currency,
  className = ''
}) => {
  const isDisabled = platform.status === 'unavailable';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const handleClick = () => {
    if (!isDisabled && onPlatformClick) {
      onPlatformClick(platform);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        grid grid-cols-5 gap-4 p-4 transition-colors duration-200
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="row"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`${platform.displayName} comparison row`}
    >
      {/* Platform Column */}
      <div className="flex items-center space-x-3">
        <PlatformLogo
          platform={platform.name}
          logo={platform.logo}
          size="md"
          className="flex-shrink-0"
        />
        <div>
          <div className="font-medium text-gray-900">{platform.displayName}</div>
          {platform.notes && (
            <div className="text-xs text-gray-600">{platform.notes}</div>
          )}
        </div>
      </div>

      {/* Delivery Price Column */}
      <div className="flex items-center">
        <PriceDisplay
          price={platform.deliveryPrice}
          isBest={highlightBest && platform.isBestDelivery}
          savings={showSavings ? platform.deliverySavings : undefined}
          currency={currency}
          className="font-semibold"
        />
      </div>

      {/* Pickup Price Column */}
      {showPickup && (
        <div className="flex items-center">
          {platform.pickupPrice ? (
            <PriceDisplay
              price={platform.pickupPrice}
              isBest={highlightBest && platform.isBestPickup}
              savings={showSavings ? platform.pickupSavings : undefined}
              currency={currency}
              className="font-semibold"
            />
          ) : (
            <span className="text-gray-400 text-sm">N/A</span>
          )}
        </div>
      )}

      {/* Time Column */}
      <div className="flex items-center">
        <TimeDisplay
          time={platform.deliveryTime}
          isBest={highlightBest && platform.isBestDelivery}
          className="text-sm"
        />
        {showPickup && platform.pickupTime && (
          <div className="ml-2">
            <TimeDisplay
              time={platform.pickupTime}
              isBest={highlightBest && platform.isBestPickup}
              className="text-xs text-gray-600"
            />
          </div>
        )}
      </div>

      {/* Status Column */}
      <div className="flex items-center justify-between">
        <StatusIndicator status={platform.status} />
        {!isDisabled && (
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            aria-label={`Open ${platform.displayName} in new tab`}
          >
            Open →
          </button>
        )}
      </div>
    </div>
  );
};
