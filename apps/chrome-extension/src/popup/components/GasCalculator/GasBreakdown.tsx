import React from 'react';
import { GasBreakdownProps, CURRENCY_SYMBOLS } from './types';

/**
 * Gas breakdown component
 * Shows detailed gas cost calculation
 */
export const GasBreakdown: React.FC<GasBreakdownProps> = ({
  calculation,
  currency,
  showDetailed,
  className = ''
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">Gas Cost Breakdown</h4>
      
      <div className="space-y-3">
        {/* Distance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Round Trip Distance</span>
          <span className="font-semibold text-gray-900">
            {calculation.distance.toFixed(1)} miles
          </span>
        </div>

        {/* Gas Price */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Gas Price per Gallon</span>
          <span className="font-semibold text-gray-900">
            {currencySymbol}{calculation.gasPrice.toFixed(2)}
          </span>
        </div>

        {/* MPG */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Your Vehicle MPG</span>
          <span className="font-semibold text-gray-900">
            {calculation.mpg} mpg
          </span>
        </div>

        {/* Calculation */}
        {showDetailed && (
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Calculation:</div>
            <div className="text-sm font-mono text-gray-800">
              ({calculation.distance.toFixed(1)} miles ÷ {calculation.mpg} mpg) × {currencySymbol}{calculation.gasPrice.toFixed(2)} = {currencySymbol}{calculation.gasCost.toFixed(2)}
            </div>
          </div>
        )}

        {/* Total Gas Cost */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Gas Cost</span>
            <span className="font-bold text-lg text-gray-900">
              {currencySymbol}{calculation.gasCost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Additional Info */}
        {showDetailed && (
          <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded border">
            <div className="font-medium mb-1">📊 Cost per Mile:</div>
            <div className="font-mono">
              {currencySymbol}{(calculation.gasCost / calculation.distance).toFixed(3)} per mile
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
