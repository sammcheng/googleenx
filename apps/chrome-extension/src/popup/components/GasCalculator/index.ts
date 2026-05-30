/**
 * GasCalculator component exports
 */

export { GasCalculator, CompactGasCalculator } from './GasCalculator';
export { MpgEditor } from './MpgEditor';
export { GasBreakdown } from './GasBreakdown';
export { SavingsDisplay } from './SavingsDisplay';
export { RouteMap, RouteInfo } from './RouteMap';
export { TimeCalculation } from './TimeCalculation';
export { LoadingState } from './LoadingState';
export { ErrorState } from './ErrorState';

// Types
export type {
  GasCalculationData,
  GasCalculatorProps,
  UserSettings,
  MpgEditorProps,
  GasBreakdownProps,
  SavingsDisplayProps,
  RouteMapProps,
  TimeCalculationProps
} from './types';

// Constants
export {
  DEFAULT_MPG,
  DEFAULT_GAS_PRICE,
  MIN_MPG,
  MAX_MPG,
  MIN_GAS_PRICE,
  MAX_GAS_PRICE,
  CURRENCY_SYMBOLS,
  MPG_PRESETS,
  GAS_PRICE_PRESETS,
  TIME_PRESETS
} from './types';
