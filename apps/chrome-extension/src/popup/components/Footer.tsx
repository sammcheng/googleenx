import React from 'react';

/**
 * Footer component for popup
 * Shows comparison count, last updated time, and settings link
 */
export const Footer: React.FC<{
  comparisonCount: number;
  lastUpdated?: number;
  onSettingsClick: () => void;
}> = ({ comparisonCount, lastUpdated, onSettingsClick }) => {
  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-3">
      <div className="flex items-center justify-between text-xs text-gray-600">
        {/* Comparison Count */}
        <div className="flex items-center space-x-2">
          <span>📊</span>
          <span>
            {comparisonCount} {comparisonCount === 1 ? 'comparison' : 'comparisons'}
          </span>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center space-x-1">
            <span>🕒</span>
            <span>Updated {formatLastUpdated(lastUpdated)}</span>
          </div>
        )}

        {/* Settings Link */}
        <button
          onClick={onSettingsClick}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
          title="Open settings"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
