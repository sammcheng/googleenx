import React from 'react';
import { TableHeaderProps, SORT_ICONS } from './types';

/**
 * Table header component with sorting functionality
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  label,
  sortable,
  sortConfig,
  onSort,
  className = ''
}) => {
  const isActive = sortConfig?.column === column;
  const sortIcon = isActive 
    ? SORT_ICONS[sortConfig.direction]
    : SORT_ICONS.none;

  const handleClick = () => {
    if (sortable) {
      onSort(column);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        flex items-center justify-between p-2
        ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="columnheader"
      tabIndex={sortable ? 0 : -1}
      aria-sort={isActive ? sortConfig.direction : 'none'}
      aria-label={`${label}${sortable ? ', click to sort' : ''}`}
    >
      <span className="font-medium text-gray-900">{label}</span>
      {sortable && (
        <span 
          className={`
            text-sm transition-colors duration-200
            ${isActive ? 'text-blue-600' : 'text-gray-400'}
          `}
          aria-hidden="true"
        >
          {sortIcon}
        </span>
      )}
    </div>
  );
};
