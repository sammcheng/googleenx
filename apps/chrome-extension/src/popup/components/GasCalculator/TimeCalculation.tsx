import React from 'react';
import { TimeCalculationProps } from './types';

/**
 * Time calculation component
 * Shows detailed time breakdown for pickup
 */
export const TimeCalculation: React.FC<TimeCalculationProps> = ({
  timeToPickup,
  timeToReturn,
  totalTime,
  className = ''
}) => {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-blue-900 mb-3">Time Breakdown</h4>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Drive Time */}
        <div>
          <div className="text-sm text-blue-600 mb-1">Drive Time</div>
          <div className="text-lg font-semibold text-blue-900">
            {formatTime(timeToPickup)}
          </div>
          <div className="text-xs text-blue-700">to restaurant</div>
        </div>

        {/* Return Time */}
        <div>
          <div className="text-sm text-blue-600 mb-1">Return Time</div>
          <div className="text-lg font-semibold text-blue-900">
            {formatTime(timeToReturn)}
          </div>
          <div className="text-xs text-blue-700">back home</div>
        </div>

        {/* Total Time */}
        <div>
          <div className="text-sm text-blue-600 mb-1">Total Time</div>
          <div className="text-lg font-semibold text-blue-900">
            {formatTime(totalTime)}
          </div>
          <div className="text-xs text-blue-700">round trip</div>
        </div>
      </div>

      {/* Time Context */}
      <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
        <div className="font-medium mb-1">⏱️ Time Considerations:</div>
        <ul className="space-y-1">
          <li>• Includes driving time only</li>
          <li>• Add 5-10 minutes for parking and pickup</li>
          <li>• Consider traffic conditions</li>
          <li>• Factor in your time value</li>
        </ul>
      </div>
    </div>
  );
};
