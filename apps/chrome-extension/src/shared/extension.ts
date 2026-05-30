export const STORAGE_KEYS = {
  authToken: 'auth_token',
  comparisonResults: 'comparison_results',
  userPreferences: 'user_preferences',
  deliveryPreferences: 'deliveryPreferences',
  lastComparison: 'last_comparison',
  lastCartData: 'last_cart_data',
} as const;

export const EXTENSION_MESSAGE_TYPES = {
  EXTRACTED_CART_DATA: 'EXTRACTED_CART_DATA',
  REQUEST_COMPARISON: 'REQUEST_COMPARISON',
  GET_STORED_RESULTS: 'GET_STORED_RESULTS',
  CLEAR_STORED_RESULTS: 'CLEAR_STORED_RESULTS',
  AUTH_TOKEN_UPDATE: 'AUTH_TOKEN_UPDATE',
  HEALTH_CHECK: 'HEALTH_CHECK',
  COMPARISON_COMPLETE: 'COMPARISON_COMPLETE',
  COMPARISON_ERROR: 'COMPARISON_ERROR',
} as const;

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  modifiers?: string[];
}

export interface DeliveryInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
}

export interface RestaurantInfo {
  name: string;
  id?: string;
  rating?: number;
  cuisine?: string;
  deliveryTime?: string;
}

export interface CartData {
  platform: string;
  restaurant: RestaurantInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  total: number;
  deliveryInfo: DeliveryInfo;
  url: string;
  timestamp: string;
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

export interface DeliveryPreferences {
  defaultCurrency: string;
  preferredPlatforms: string[];
  mpg: number;
  gasPrice: number;
  priceAlerts: boolean;
  notifications: boolean;
  autoCompare: boolean;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface ExtensionMessage<T = unknown> {
  type: string;
  data?: T;
  payload?: T;
}

export interface RuntimeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  comparisonId?: string;
}

export interface PopupComparisonItem {
  name: string;
  originalPrice: number;
  platformPrice: number;
  priceDifference: number;
  isAvailable: boolean;
  modifiers?: string[];
  description?: string;
}

export interface PopupPlatformComparison {
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
  items: PopupComparisonItem[];
  notes?: string;
  availability: 'available' | 'unavailable' | 'limited';
  lastUpdated: number;
}

export interface PopupComparisonResult {
  id: string;
  originalPlatform: string;
  comparisons: PopupPlatformComparison[];
  timestamp: number;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface BackendComparisonResult {
  comparisonId: string;
  timestamp: string;
  platforms: Array<{
    platform: string;
    available: boolean;
    restaurant: {
      name: string;
      rating?: number;
      distance?: number;
    };
    delivery?: {
      available: boolean;
      price: number;
      deliveryFee: number;
      serviceFee: number;
      tax: number;
      tip?: number;
      total: number;
      estimatedTime: number;
    };
    pickup?: {
      available: boolean;
      price: number;
      estimatedTime: number;
    };
    gasCalculation?: {
      gasCost: number;
    };
    error?: string;
  }>;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}
