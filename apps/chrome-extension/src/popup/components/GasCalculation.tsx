import React from 'react';
import type { GasCalculation as GasCalculationData, GasCalculationProps } from '../types';

/**
 * Gas calculation component for pickup options
 * Shows detailed breakdown of gas costs and time
 */
export const GasCalculation: React.FC<GasCalculationProps> = ({
  calculation,
  totalSavings,
  isVisible
}) => {
  if (!isVisible || !calculation) {
    return null;
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const netSavings = totalSavings - calculation.gasCost;
  const isWorthIt = netSavings > 0;

  return (
    <div className="p-4 bg-blue-50 border-t border-blue-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <div className="text-blue-600">⛽</div>
          <h3 className="font-semibold text-blue-900">Gas Cost Analysis</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isWorthIt 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isWorthIt ? 'Worth It' : 'Not Worth It'}
          </div>
        </div>

        {/* Gas Cost Breakdown */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Distance */}
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Round Trip Distance</div>
              <div className="font-semibold text-gray-900">
                {calculation.distance.toFixed(1)} miles
              </div>
            </div>

            {/* Gas Cost */}
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Gas Cost</div>
              <div className="font-semibold text-gray-900">
                {formatPrice(calculation.gasCost)}
              </div>
            </div>

            {/* MPG */}
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Your MPG</div>
              <div className="font-semibold text-gray-900">
                {calculation.mpg} mpg
              </div>
            </div>

            {/* Gas Price */}
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Gas Price</div>
              <div className="font-semibold text-gray-900">
                {formatPrice(calculation.gasPrice)}/gal
              </div>
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Drive Time</div>
                <div className="font-semibold text-gray-900">
                  {formatTime(calculation.timeToPickup)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Return Time</div>
                <div className="font-semibold text-gray-900">
                  {formatTime(calculation.timeToReturn)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Time</div>
                <div className="font-semibold text-gray-900">
                  {formatTime(calculation.totalTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Analysis */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Savings Analysis</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Savings</span>
              <span className="font-semibold text-green-600">
                +{formatPrice(totalSavings)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Gas Cost</span>
              <span className="font-semibold text-red-600">
                -{formatPrice(calculation.gasCost)}
              </span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Net Savings</span>
                <span className={`font-bold text-lg ${
                  isWorthIt ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isWorthIt ? '+' : ''}{formatPrice(netSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`p-3 rounded-lg ${
            isWorthIt 
              ? 'bg-green-100 border border-green-200' 
              : 'bg-red-100 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {isWorthIt ? '✅' : '❌'}
              </span>
              <span className={`font-medium ${
                isWorthIt ? 'text-green-800' : 'text-red-800'
              }`}>
                {isWorthIt 
                  ? `Pickup is worth it! You'll save ${formatPrice(netSavings)}`
                  : `Pickup isn't worth it. You'd lose ${formatPrice(Math.abs(netSavings))}`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600">💡</span>
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">Tips for Pickup:</div>
              <ul className="space-y-1 text-xs">
                <li>• Call ahead to confirm order is ready</li>
                <li>• Consider traffic conditions</li>
                <li>• Factor in your time value</li>
                <li>• Check for parking availability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Gas calculation summary component
 */
export const GasCalculationSummary: React.FC<{
  calculation: GasCalculationData;
  totalSavings: number;
}> = ({ calculation, totalSavings }) => {
  const netSavings = totalSavings - calculation.gasCost;
  const isWorthIt = netSavings > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-blue-600">⛽</span>
        <span className="text-sm font-medium text-blue-900">
          Gas: ${calculation.gasCost.toFixed(2)}
        </span>
      </div>
      
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        isWorthIt 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isWorthIt ? `+$${netSavings.toFixed(2)}` : `-$${Math.abs(netSavings).toFixed(2)}`}
      </div>
    </div>
  );
};
