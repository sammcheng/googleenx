import React from 'react';
import { PlatformIconProps, PLATFORM_ICONS } from '../types';

/**
 * Platform icon component
 * Displays platform-specific icons with consistent styling
 */
export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 'md',
  className = ''
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4 text-xs';
      case 'md':
        return 'w-6 h-6 text-sm';
      case 'lg':
        return 'w-8 h-8 text-base';
      default:
        return 'w-6 h-6 text-sm';
    }
  };

  const icon = PLATFORM_ICONS[platform] || '🍽️';
  const sizeClasses = getSizeClasses(size);

  return (
    <div className={`
      flex items-center justify-center rounded-full bg-gray-100
      ${sizeClasses} ${className}
    `}>
      <span className="text-lg">{icon}</span>
    </div>
  );
};
