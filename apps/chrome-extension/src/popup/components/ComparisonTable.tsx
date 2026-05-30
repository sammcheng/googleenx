import React from 'react';
import { ComparisonTableProps, PlatformComparison, PLATFORM_NAMES } from '../types';
import { BestDealBadge } from './BestDealBadge';
import { PlatformIcon } from './PlatformIcon';

/**
 * Comparison table component
 * Displays price comparisons in a responsive table format
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  comparisons,
  showGasCalculation,
  userPreferences
}) => {
  void userPreferences;

  if (comparisons.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 text-sm">No comparisons available</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {comparisons.map((comparison, index) => (
        <ComparisonCard
          key={`${comparison.platform}-${index}`}
          comparison={comparison}
          showGasCalculation={showGasCalculation}
        />
      ))}
    </div>
  );
};

/**
 * Individual comparison card component
 */
const ComparisonCard: React.FC<{
  comparison: PlatformComparison;
  showGasCalculation: boolean;
}> = ({ comparison, showGasCalculation }) => {
  const isBestDeal = comparison.isBestDeal;
  const isOriginalPlatform = comparison.isOriginalPlatform;
  const savings = comparison.savings || 0;
  const savingsPercentage = comparison.savingsPercentage || 0;

  return (
    <div className={`
      bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md
      ${isBestDeal ? 'border-green-500 bg-green-50' : 'border-gray-200'}
      ${isOriginalPlatform ? 'ring-2 ring-blue-200' : ''}
    `}>
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PlatformIcon 
              platform={comparison.platform}
              size="md"
              className="flex-shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">
                  {PLATFORM_NAMES[comparison.platform] || comparison.platformName}
                </h3>
                {isOriginalPlatform && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Original
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {comparison.restaurantInfo.rating > 0 && (
                  <span className="flex items-center">
                    ⭐ {comparison.restaurantInfo.rating}
                  </span>
                )}
                {comparison.estimatedDeliveryTime && (
                  <span>🚚 {comparison.estimatedDeliveryTime}</span>
                )}
                {comparison.estimatedPickupTime && (
                  <span>🏃 {comparison.estimatedPickupTime}</span>
                )}
                {comparison.distance && (
                  <span>📍 {comparison.distance.toFixed(1)} mi</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <BestDealBadge 
                isBestDeal={isBestDeal}
                savings={savings}
                savingsPercentage={savingsPercentage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="p-4">
        <PriceBreakdown comparison={comparison} />
        
        {/* Gas Calculation for Pickup */}
        {showGasCalculation && comparison.isPickup && comparison.gasCost && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">Gas Cost (Round Trip)</span>
              <span className="text-blue-900 font-semibold">
                ${comparison.gasCost.toFixed(2)}
              </span>
            </div>
            {comparison.totalWithGas && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-blue-700">Total with Gas</span>
                <span className="text-blue-900 font-semibold">
                  ${comparison.totalWithGas.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Availability Status */}
        <div className="mt-3">
          <AvailabilityStatus status={comparison.availability} />
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button 
            className={`
              w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200
              ${isBestDeal 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              ${comparison.availability === 'unavailable' 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
            disabled={comparison.availability === 'unavailable'}
            onClick={() => handlePlatformClick(comparison)}
          >
            {comparison.availability === 'unavailable' 
              ? 'Unavailable' 
              : isBestDeal 
                ? 'Get Best Deal' 
                : 'View on Platform'
            }
          </button>
        </div>

        {/* Notes */}
        {comparison.notes && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            {comparison.notes}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Price breakdown component
 */
const PriceBreakdown: React.FC<{ comparison: PlatformComparison }> = ({ comparison }) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  
  return (
    <div className="space-y-2">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium">{formatPrice(comparison.totalPrice - comparison.deliveryFee - comparison.serviceFee - comparison.tax - (comparison.tip || 0))}</span>
      </div>
      
      {/* Delivery Fee */}
      {comparison.deliveryFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-medium">{formatPrice(comparison.deliveryFee)}</span>
        </div>
      )}
      
      {/* Service Fee */}
      {comparison.serviceFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Service Fee</span>
          <span className="font-medium">{formatPrice(comparison.serviceFee)}</span>
        </div>
      )}
      
      {/* Tax */}
      {comparison.tax > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">{formatPrice(comparison.tax)}</span>
        </div>
      )}
      
      {/* Tip */}
      {comparison.tip && comparison.tip > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tip</span>
          <span className="font-medium">{formatPrice(comparison.tip)}</span>
        </div>
      )}
      
      {/* Total */}
      <div className="border-t pt-2">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">
            {formatPrice(comparison.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Availability status component
 */
const AvailabilityStatus: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          text: 'Available',
          className: 'text-green-600 bg-green-100',
          icon: '✅'
        };
      case 'limited':
        return {
          text: 'Limited Availability',
          className: 'text-yellow-600 bg-yellow-100',
          icon: '⚠️'
        };
      case 'unavailable':
        return {
          text: 'Unavailable',
          className: 'text-red-600 bg-red-100',
          icon: '❌'
        };
      default:
        return {
          text: 'Unknown',
          className: 'text-gray-600 bg-gray-100',
          icon: '❓'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

/**
 * Handle platform click
 */
const handlePlatformClick = (comparison: PlatformComparison) => {
  if (comparison.availability === 'unavailable') return;
  
  // Open platform in new tab
  const platformUrls: Record<string, string> = {
    doordash: 'https://www.doordash.com',
    ubereats: 'https://www.ubereats.com',
    grubhub: 'https://www.grubhub.com',
    seamless: 'https://www.seamless.com',
    postmates: 'https://www.postmates.com'
  };

  const url = platformUrls[comparison.platform];
  if (url) {
    chrome.tabs.create({ url });
  }
};
