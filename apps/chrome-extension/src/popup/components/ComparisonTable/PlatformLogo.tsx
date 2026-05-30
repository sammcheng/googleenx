import React from 'react';
import { PlatformLogoProps } from './types';

/**
 * Platform logo component
 * Displays platform-specific logos with consistent styling
 */
export const PlatformLogo: React.FC<PlatformLogoProps> = ({
  platform,
  logo,
  size = 'md',
  className = ''
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-sm';
      case 'md':
        return 'w-8 h-8 text-base';
      case 'lg':
        return 'w-10 h-10 text-lg';
      default:
        return 'w-8 h-8 text-base';
    }
  };

  const sizeClasses = getSizeClasses(size);

  return (
    <div 
      className={`
        flex items-center justify-center rounded-full bg-gray-100
        ${sizeClasses} ${className}
      `}
      role="img"
      aria-label={`${platform} logo`}
    >
      <span className="text-lg" aria-hidden="true">
        {logo}
      </span>
    </div>
  );
};
