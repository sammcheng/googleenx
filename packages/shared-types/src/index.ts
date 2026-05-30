// Food item types
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  description?: string;
  imageUrl?: string;
  nutritionInfo?: NutritionInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: string;
}

export enum FoodCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  MEAT = 'meat',
  DAIRY = 'dairy',
  GRAINS = 'grains',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  FROZEN = 'frozen',
  CANNED = 'canned',
  OTHER = 'other',
}

// Store and pricing types
export interface Store {
  id: string;
  name: string;
  chain?: string;
  location: StoreLocation;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Price {
  id: string;
  foodItemId: string;
  storeId: string;
  price: number;
  currency: string;
  unit: PriceUnit;
  quantity: number;
  isOnSale: boolean;
  salePrice?: number;
  saleEndDate?: Date;
  isAvailable: boolean;
  lastUpdated: Date;
  source: PriceSource;
}

export enum PriceUnit {
  PER_ITEM = 'per_item',
  PER_POUND = 'per_pound',
  PER_KILOGRAM = 'per_kilogram',
  PER_LITER = 'per_liter',
  PER_GALLON = 'per_gallon',
  PER_OUNCE = 'per_ounce',
}

export enum PriceSource {
  MANUAL = 'manual',
  SCRAPED = 'scraped',
  API = 'api',
  USER_REPORTED = 'user_reported',
}

// User and comparison types
export interface User {
  id: string;
  email: string;
  name?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  defaultCurrency: string;
  preferredStores: string[];
  priceAlerts: boolean;
  notifications: boolean;
}

export interface PriceComparison {
  foodItemId: string;
  prices: PriceWithStore[];
  bestPrice: PriceWithStore;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  lastUpdated: Date;
}

export interface PriceWithStore extends Price {
  store: Store;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: FoodCategory;
  storeIds?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  isOnSale?: boolean;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
}

export enum SortOption {
  PRICE = 'price',
  NAME = 'name',
  STORE = 'store',
  LAST_UPDATED = 'lastUpdated',
}

// Chrome extension specific types
export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: any;
}

export enum ExtensionMessageType {
  GET_PRICES = 'GET_PRICES',
  GET_STORES = 'GET_STORES',
  SEARCH_FOOD = 'SEARCH_FOOD',
  REPORT_PRICE = 'REPORT_PRICE',
  GET_USER_PREFERENCES = 'GET_USER_PREFERENCES',
  UPDATE_USER_PREFERENCES = 'UPDATE_USER_PREFERENCES',
}

export interface ScrapedPriceData {
  foodItem: Partial<FoodItem>;
  price: Partial<Price>;
  store: Partial<Store>;
  url: string;
  scrapedAt: Date;
}
