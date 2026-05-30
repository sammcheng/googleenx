import React from 'react';
import { SavingsDisplayProps, CURRENCY_SYMBOLS } from './types';

/**
 * Savings display component
 * Shows savings comparison between delivery and pickup
 */
export const SavingsDisplay: React.FC<SavingsDisplayProps> = ({
  savings,
  savingsPercentage,
  currency,
  isWorthIt,
  className = ''
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${
      isWorthIt 
        ? 'border-green-200 bg-green-50' 
        : 'border-red-200 bg-red-50'
    } ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold ${
          isWorthIt ? 'text-green-900' : 'text-red-900'
        }`}>
          Savings Analysis
        </h4>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isWorthIt 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isWorthIt ? 'Save Money' : 'Lose Money'}
        </div>
      </div>

      <div className="space-y-3">
        {/* Savings Amount */}
        <div className="flex justify-between items-center">
          <span className={`font-medium ${
            isWorthIt ? 'text-green-700' : 'text-red-700'
          }`}>
            {isWorthIt ? 'You Save' : 'You Lose'}
          </span>
          <span className={`text-2xl font-bold ${
            isWorthIt ? 'text-green-600' : 'text-red-600'
          }`}>
            {isWorthIt ? '+' : ''}{currencySymbol}{Math.abs(savings).toFixed(2)}
          </span>
        </div>

        {/* Savings Percentage */}
        <div className="flex justify-between items-center">
          <span className={`text-sm ${
            isWorthIt ? 'text-green-600' : 'text-red-600'
          }`}>
            Percentage
          </span>
          <span className={`font-semibold ${
            isWorthIt ? 'text-green-600' : 'text-red-600'
          }`}>
            {isWorthIt ? '+' : ''}{Math.abs(savingsPercentage).toFixed(1)}%
          </span>
        </div>

        {/* Recommendation */}
        <div className={`p-3 rounded-lg border ${
          isWorthIt 
            ? 'bg-green-100 border-green-300' 
            : 'bg-red-100 border-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl">
              {isWorthIt ? '✅' : '❌'}
            </span>
            <div>
              <div className={`font-medium ${
                isWorthIt ? 'text-green-800' : 'text-red-800'
              }`}>
                {isWorthIt 
                  ? 'Pickup is worth it!'
                  : 'Delivery is better'
                }
              </div>
              <div className={`text-sm ${
                isWorthIt ? 'text-green-700' : 'text-red-700'
              }`}>
                {isWorthIt 
                  ? `You'll save ${currencySymbol}${Math.abs(savings).toFixed(2)} by picking up`
                  : `You'd lose ${currencySymbol}${Math.abs(savings).toFixed(2)} by picking up`
                }
              </div>
            </div>
          </div>
        </div>

        {/* Additional Context */}
        <div className={`text-xs ${
          isWorthIt ? 'text-green-600' : 'text-red-600'
        }`}>
          {isWorthIt ? (
            <div>
              💡 <strong>Tip:</strong> The savings of {currencySymbol}{Math.abs(savings).toFixed(2)} 
              covers your gas cost and gives you extra savings!
            </div>
          ) : (
            <div>
              💡 <strong>Tip:</strong> The gas cost makes pickup more expensive than delivery. 
              Stick with delivery to save money.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
