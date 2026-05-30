/**
 * TypeScript interfaces for popup data structures
 */

export interface ComparisonResult {
  id: string;
  originalPlatform: string;
  comparisons: PlatformComparison[];
  timestamp: number;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface PlatformComparison {
  platform: string;
  platformName: string;
  platformIcon: string;
  totalPrice: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  estimatedDeliveryTime?: string;
  estimatedPickupTime?: string;
  isDelivery: boolean;
  isPickup: boolean;
  distance?: number;
  gasCost?: number;
  totalWithGas?: number;
  savings?: number;
  savingsPercentage?: number;
  isBestDeal: boolean;
  isOriginalPlatform: boolean;
  restaurantInfo: {
    name: string;
    rating: number;
    distance: number;
    estimatedTime: string;
  };
  items: ComparisonItem[];
  notes?: string;
  availability: 'available' | 'unavailable' | 'limited';
  lastUpdated: number;
}

export interface ComparisonItem {
  name: string;
  originalPrice: number;
  platformPrice: number;
  priceDifference: number;
  isAvailable: boolean;
  modifiers?: string[];
  description?: string;
}

export interface GasCalculation {
  distance: number; // in miles
  mpg: number; // miles per gallon
  gasPrice: number; // per gallon
  gasCost: number; // calculated cost
  timeToPickup: number; // in minutes
  timeToReturn: number; // in minutes
  totalTime: number; // in minutes
}

export interface UserPreferences {
  mpg: number;
  gasPrice: number;
  preferredPlatforms: string[];
  includeGasCalculation: boolean;
  showPickupOnly: boolean;
  showDeliveryOnly: boolean;
  currency: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TabData {
  id: string;
  label: string;
  count: number;
  isActive: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorCode?: string;
  retryFunction?: () => void;
}

export interface PopupState {
  comparisonData: ComparisonResult | null;
  activeTab: string;
  loadingState: LoadingState;
  errorState: ErrorState;
  userPreferences: UserPreferences;
  filteredComparisons: PlatformComparison[];
}

export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export interface ComparisonTableProps {
  comparisons: PlatformComparison[];
  showGasCalculation: boolean;
  userPreferences: UserPreferences;
}

export interface GasCalculationProps {
  calculation: GasCalculation | null;
  totalSavings: number;
  isVisible: boolean;
}

export interface BestDealBadgeProps {
  isBestDeal: boolean;
  savings?: number;
  savingsPercentage?: number;
}

export interface PlatformIconProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ResponsiveBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface PopupDimensions {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
}

// Constants
export const POPUP_DIMENSIONS: PopupDimensions = {
  width: 400,
  height: 600,
  maxWidth: 400,
  maxHeight: 600
};

export const TAB_TYPES = {
  ALL: 'all',
  DELIVERY_ONLY: 'delivery',
  PICKUP_ONLY: 'pickup'
} as const;

export const PLATFORM_ICONS: Record<string, string> = {
  doordash: '🚚',
  ubereats: '🚗',
  grubhub: '🛵',
  seamless: '🍽️',
  postmates: '📦'
};

export const PLATFORM_NAMES: Record<string, string> = {
  doordash: 'DoorDash',
  ubereats: 'Uber Eats',
  grubhub: 'Grubhub',
  seamless: 'Seamless',
  postmates: 'Postmates'
};

export const LOADING_MESSAGES = {
  LOADING_DATA: 'Loading comparison data...',
  FETCHING_RESULTS: 'Fetching price comparisons...',
  CALCULATING_SAVINGS: 'Calculating savings...',
  UPDATING_RESULTS: 'Updating results...'
} as const;

export const ERROR_MESSAGES = {
  NO_DATA: 'No comparison data available',
  LOADING_FAILED: 'Failed to load comparison data',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  STORAGE_ERROR: 'Failed to access stored data',
  API_ERROR: 'Failed to fetch comparison results'
} as const;
