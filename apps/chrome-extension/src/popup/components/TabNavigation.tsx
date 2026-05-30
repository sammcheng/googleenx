import React from 'react';
import { TabData } from '../types';

/**
 * Tab navigation component
 * Provides tab switching functionality with counts
 */
export const TabNavigation: React.FC<{
  tabs: TabData[];
  onTabChange: (tabId: string) => void;
  isLoading: boolean;
}> = ({ tabs, onTabChange, isLoading }) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex space-x-1 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={isLoading}
            className={`
              flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${tab.isActive
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${tab.isActive
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
