import React from 'react';
import { BestDealBadgeProps } from '../types';

/**
 * Best deal badge component
 * Highlights the best deal with green styling and savings info
 */
export const BestDealBadge: React.FC<BestDealBadgeProps> = ({
  isBestDeal,
  savings,
  savingsPercentage
}) => {
  if (!isBestDeal) {
    return null;
  }

  const formatSavings = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercentage = (percentage: number) => `${percentage.toFixed(0)}%`;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        <span>🏆</span>
        <span>Best Deal</span>
      </div>
      
      {savings && savings > 0 && (
        <div className="text-sm font-semibold text-green-600">
          Save {formatSavings(savings)}
          {savingsPercentage && savingsPercentage > 0 && (
            <span className="text-xs text-green-500 ml-1">
              ({formatPercentage(savingsPercentage)})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
