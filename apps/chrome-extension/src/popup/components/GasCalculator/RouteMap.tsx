import React from 'react';
import { RouteMapProps } from './types';

/**
 * Route map component
 * Shows interactive map with route information
 */
export const RouteMap: React.FC<RouteMapProps> = ({
  distance,
  timeToPickup,
  restaurantName,
  className = ''
}) => {
  return (
    <div className={`bg-gray-100 rounded-lg border border-gray-200 ${className}`}>
      {/* Map Placeholder */}
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <div className="text-sm text-gray-600">Interactive Map</div>
          <div className="text-xs text-gray-500">
            {distance.toFixed(1)} mi • {timeToPickup} min
          </div>
        </div>
      </div>

      {/* Route Information Overlay */}
      <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2">
        <div className="text-xs text-gray-600">
          <div className="font-medium">Route to {restaurantName}</div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-blue-600">📍</span>
            <span>{distance.toFixed(1)} mi</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">⏱️</span>
            <span>{timeToPickup} min</span>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-2 left-2 flex space-x-1">
        <button className="bg-white rounded shadow p-1 hover:bg-gray-50 transition-colors duration-200">
          <span className="text-xs">+</span>
        </button>
        <button className="bg-white rounded shadow p-1 hover:bg-gray-50 transition-colors duration-200">
          <span className="text-xs">-</span>
        </button>
        <button className="bg-white rounded shadow p-1 hover:bg-gray-50 transition-colors duration-200">
          <span className="text-xs">📍</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Compact route info component
 * Shows route information without map
 */
export const RouteInfo: React.FC<RouteMapProps> = ({
  distance,
  timeToPickup,
  restaurantName,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">Route to {restaurantName}</div>
          <div className="text-sm text-gray-600">
            {distance.toFixed(1)} miles • {timeToPickup} minutes
          </div>
        </div>
        <div className="text-2xl">🗺️</div>
      </div>
    </div>
  );
};
