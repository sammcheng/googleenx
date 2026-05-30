import React from 'react';
import { TimeDisplayProps } from './types';

/**
 * Time display component
 * Shows delivery/pickup time with best deal highlighting
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  time,
  isBest,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span 
        className={`
          ${isBest ? 'text-green-600 font-semibold' : 'text-gray-900'}
        `}
        aria-label={`Time: ${time}${isBest ? ', fastest option' : ''}`}
      >
        {time}
      </span>
      
      {isBest && (
        <span 
          className="text-xs text-green-600"
          aria-label="Fastest option"
        >
          ⚡
        </span>
      )}
    </div>
  );
};
