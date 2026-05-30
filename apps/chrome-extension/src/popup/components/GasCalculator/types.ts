/**
 * TypeScript interfaces for GasCalculator component
 */

export interface GasCalculationData {
  distance: number; // in miles (round trip)
  gasPrice: number; // per gallon
  mpg: number; // miles per gallon
  gasCost: number; // calculated cost
  foodCost: number; // pickup food cost
  totalPickupCost: number; // food + gas
  deliveryCost: number; // delivery cost for comparison
  savings: number; // delivery - pickup total
  savingsPercentage: number; // percentage savings
  timeToPickup: number; // in minutes
  timeToReturn: number; // in minutes
  totalTime: number; // in minutes
}

export interface GasCalculatorProps {
  calculation: GasCalculationData;
  onMpgChange?: (mpg: number) => void;
  onSaveSettings?: (settings: UserSettings) => void;
  className?: string;
  showMap?: boolean;
  editable?: boolean;
  currency?: string;
  loading?: boolean;
  error?: string;
}

export interface UserSettings {
  mpg: number;
  gasPrice: number;
  defaultMpg: number;
  autoSave: boolean;
  showTimeCalculation: boolean;
  showDetailedBreakdown: boolean;
}

export interface MpgEditorProps {
  currentMpg: number;
  onSave: (mpg: number) => void;
  onCancel: () => void;
  className?: string;
}

export interface GasBreakdownProps {
  calculation: GasCalculationData;
  currency: string;
  showDetailed: boolean;
  className?: string;
}

export interface SavingsDisplayProps {
  savings: number;
  savingsPercentage: number;
  currency: string;
  isWorthIt: boolean;
  className?: string;
}

export interface RouteMapProps {
  distance: number;
  timeToPickup: number;
  restaurantName: string;
  className?: string;
}

export interface TimeCalculationProps {
  timeToPickup: number;
  timeToReturn: number;
  totalTime: number;
  className?: string;
}

// Constants
export const DEFAULT_MPG = 25;
export const DEFAULT_GAS_PRICE = 3.50;
export const MIN_MPG = 10;
export const MAX_MPG = 50;
export const MIN_GAS_PRICE = 1.00;
export const MAX_GAS_PRICE = 10.00;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$'
} as const;

export const MPG_PRESETS = [
  { label: 'Economy Car', value: 30 },
  { label: 'Compact Car', value: 25 },
  { label: 'SUV', value: 20 },
  { label: 'Truck', value: 15 },
  { label: 'Hybrid', value: 40 },
  { label: 'Electric', value: 0 } // Special case for electric vehicles
] as const;

export const GAS_PRICE_PRESETS = [
  { label: 'Low', value: 2.50 },
  { label: 'Average', value: 3.50 },
  { label: 'High', value: 4.50 },
  { label: 'Premium', value: 5.00 }
] as const;

export const TIME_PRESETS = [
  { label: 'Quick Pickup', value: 10 },
  { label: 'Normal Pickup', value: 15 },
  { label: 'Busy Pickup', value: 25 },
  { label: 'Slow Pickup', value: 35 }
] as const;
