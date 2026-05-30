/**
 * ComparisonTable component exports
 */

export { ComparisonTable, CompactComparisonTable, MobileComparisonTable } from './ComparisonTable';
export { TableHeader } from './TableHeader';
export { TableRow } from './TableRow';
export { PlatformLogo } from './PlatformLogo';
export { StatusIndicator } from './StatusIndicator';
export { PriceDisplay } from './PriceDisplay';
export { TimeDisplay } from './TimeDisplay';
export { LoadingState } from './LoadingState';
export { ErrorState } from './ErrorState';
export { EmptyState } from './EmptyState';

// Types
export type {
  PlatformData,
  PlatformStatus,
  SortConfig,
  SortableColumn,
  ComparisonTableProps,
  TableHeaderProps,
  TableRowProps,
  PlatformLogoProps,
  StatusIndicatorProps,
  PriceDisplayProps,
  TimeDisplayProps
} from './types';

// Constants
export {
  PLATFORM_LOGOS,
  PLATFORM_NAMES,
  PLATFORM_URLS,
  STATUS_CONFIG,
  SORT_ICONS,
  CURRENCY_SYMBOLS
} from './types';
