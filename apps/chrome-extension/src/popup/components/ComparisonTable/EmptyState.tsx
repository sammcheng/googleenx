import React from 'react';

/**
 * Empty state component for comparison table
 */
export const EmptyState: React.FC<{ 
  className?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ 
  className = '', 
  message = 'No comparison data available',
  action 
}) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      role="status"
      aria-label="No comparison data available"
    >
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {/* Empty Icon */}
        <div className="text-4xl mb-4" aria-hidden="true">📊</div>
        
        {/* Empty Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Data Available
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 max-w-xs">
          {message}
        </p>
        
        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            aria-label={action.label}
          >
            {action.label}
          </button>
        )}
        
        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>To see comparison data:</p>
          <ul className="mt-1 space-y-1">
            <li>• Navigate to a food delivery platform</li>
            <li>• Add items to your cart</li>
            <li>• Click the extension icon</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
