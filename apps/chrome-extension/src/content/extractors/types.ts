/**
 * TypeScript types for cart data extraction
 */

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  modifiers?: string[];
}

export interface RestaurantInfo {
  name: string;
  id?: string;
  rating?: number;
  cuisine?: string;
  deliveryTime?: string;
  address?: string;
}

export interface DeliveryInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
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
  timestamp: Date;
}

export interface ExtractionStats {
  isCheckoutPage: boolean;
  restaurantFound: boolean;
  itemsCount: number;
  pricingComplete: boolean;
  deliveryInfoFound: boolean;
}

export interface PlatformSelectors {
  checkoutPage: string[];
  restaurant: {
    name: string[];
    id?: string[];
    rating?: string[];
    deliveryTime?: string[];
    address?: string[];
  };
  cartItems: string[];
  item: {
    name: string[];
    price: string[];
    quantity: string[];
    modifiers?: string[];
    description?: string[];
  };
  pricing: {
    subtotal: string[];
    deliveryFee: string[];
    serviceFee: string[];
    tax: string[];
    tip?: string[];
    total: string[];
  };
  delivery: {
    address: string[];
    instructions?: string[];
  };
  checkoutButton: string[];
}

export interface ExtractionResult {
  success: boolean;
  data?: CartData;
  error?: string;
  stats?: ExtractionStats;
}
