/**
 * TypeScript interfaces for ComparisonTable component
 */

export interface PlatformData {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  deliveryPrice: number;
  pickupPrice?: number;
  deliveryTime: string;
  pickupTime?: string;
  status: PlatformStatus;
  isBestDelivery?: boolean;
  isBestPickup?: boolean;
  deliverySavings?: number;
  pickupSavings?: number;
  url: string;
  lastUpdated: number;
  notes?: string;
}

export type PlatformStatus = 'available' | 'unavailable' | 'limited' | 'error';

export interface SortConfig {
  column: SortableColumn;
  direction: 'asc' | 'desc';
}

export type SortableColumn = 'deliveryPrice' | 'pickupPrice' | 'deliveryTime' | 'pickupTime';

export interface ComparisonTableProps {
  platforms: PlatformData[];
  showPickup?: boolean;
  onPlatformClick?: (platform: PlatformData) => void;
  className?: string;
  sortable?: boolean;
  highlightBest?: boolean;
  showSavings?: boolean;
  currency?: string;
  loading?: boolean;
  error?: string;
}

export interface TableHeaderProps {
  column: string;
  label: string;
  sortable: boolean;
  sortConfig: SortConfig | null;
  onSort: (column: string) => void;
  className?: string;
}

export interface TableRowProps {
  platform: PlatformData;
  showPickup: boolean;
  onPlatformClick: (platform: PlatformData) => void;
  highlightBest: boolean;
  showSavings: boolean;
  currency: string;
  className?: string;
}

export interface PlatformLogoProps {
  platform: string;
  logo: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface StatusIndicatorProps {
  status: PlatformStatus;
  className?: string;
}

export interface PriceDisplayProps {
  price: number;
  isBest: boolean;
  savings?: number;
  currency: string;
  className?: string;
}

export interface TimeDisplayProps {
  time: string;
  isBest: boolean;
  className?: string;
}

// Constants
export const PLATFORM_LOGOS: Record<string, string> = {
  doordash: '🚚',
  ubereats: '🚗',
  grubhub: '🛵',
  seamless: '🍽️',
  postmates: '📦',
  caviar: '🍴',
  chownow: '🍜',
  eat24: '🍕'
};

export const PLATFORM_NAMES: Record<string, string> = {
  doordash: 'DoorDash',
  ubereats: 'Uber Eats',
  grubhub: 'Grubhub',
  seamless: 'Seamless',
  postmates: 'Postmates',
  caviar: 'Caviar',
  chownow: 'ChowNow',
  eat24: 'Eat24'
};

export const PLATFORM_URLS: Record<string, string> = {
  doordash: 'https://www.doordash.com',
  ubereats: 'https://www.ubereats.com',
  grubhub: 'https://www.grubhub.com',
  seamless: 'https://www.seamless.com',
  postmates: 'https://www.postmates.com',
  caviar: 'https://www.caviar.com',
  chownow: 'https://www.chownow.com',
  eat24: 'https://www.eat24.com'
};

export const STATUS_CONFIG: Record<PlatformStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  available: {
    label: 'Available',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '✅'
  },
  unavailable: {
    label: 'Unavailable',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '❌'
  },
  limited: {
    label: 'Limited',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '⚠️'
  },
  error: {
    label: 'Error',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '❓'
  }
};

export const SORT_ICONS = {
  asc: '↑',
  desc: '↓',
  none: '↕️'
} as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$'
} as const;
