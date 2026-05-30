import React from 'react';
import { StatusIndicatorProps, STATUS_CONFIG } from './types';

/**
 * Status indicator component
 * Shows platform availability status with color coding
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  className = ''
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <div 
      className={`
        inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
        ${config.color} ${config.bgColor} ${className}
      `}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};
