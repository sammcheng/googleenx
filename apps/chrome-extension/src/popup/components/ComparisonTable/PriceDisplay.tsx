import React from 'react';
import { PriceDisplayProps, CURRENCY_SYMBOLS } from './types';

/**
 * Price display component
 * Shows price with best deal highlighting and savings
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  isBest,
  savings,
  currency,
  className = ''
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';
  const formattedPrice = `${currencySymbol}${price.toFixed(2)}`;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span 
        className={`
          font-semibold
          ${isBest ? 'text-green-600' : 'text-gray-900'}
        `}
        aria-label={`Price: ${formattedPrice}${isBest ? ', best deal' : ''}`}
      >
        {formattedPrice}
      </span>
      
      {isBest && (
        <span 
          className="text-xs text-green-600 font-medium"
          aria-label="Best deal"
        >
          🏆
        </span>
      )}
      
      {savings && savings > 0 && (
        <span 
          className="text-xs text-green-600"
          aria-label={`Save ${currencySymbol}${savings.toFixed(2)}`}
        >
          (Save {currencySymbol}{savings.toFixed(2)})
        </span>
      )}
    </div>
  );
};
