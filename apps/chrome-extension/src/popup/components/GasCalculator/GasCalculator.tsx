import React, { useState, useCallback, useMemo } from 'react';
import { GasCalculatorProps, GasCalculationData, UserSettings } from './types';
import { MpgEditor } from './MpgEditor';
import { GasBreakdown } from './GasBreakdown';
import { SavingsDisplay } from './SavingsDisplay';
import { RouteMap } from './RouteMap';
import { TimeCalculation } from './TimeCalculation';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

/**
 * Gas Calculator component
 * Shows pickup gas cost breakdown with interactive editing
 */
export const GasCalculator: React.FC<GasCalculatorProps> = ({
  calculation,
  onMpgChange,
  onSaveSettings,
  className = '',
  showMap = false,
  editable = true,
  currency = 'USD',
  loading = false,
  error
}) => {
  const [isEditingMpg, setIsEditingMpg] = useState(false);
  const [localMpg, setLocalMpg] = useState(calculation.mpg);
  const [localGasPrice, setLocalGasPrice] = useState(calculation.gasPrice);

  /**
   * Calculate gas cost based on current values
   */
  const calculatedGasCost = useMemo(() => {
    if (localMpg <= 0) return 0;
    return (calculation.distance * localGasPrice) / localMpg;
  }, [calculation.distance, localGasPrice, localMpg]);

  /**
   * Calculate total pickup cost
   */
  const totalPickupCost = useMemo(() => {
    return calculation.foodCost + calculatedGasCost;
  }, [calculation.foodCost, calculatedGasCost]);

  /**
   * Calculate savings vs delivery
   */
  const savings = useMemo(() => {
    return calculation.deliveryCost - totalPickupCost;
  }, [calculation.deliveryCost, totalPickupCost]);

  /**
   * Calculate savings percentage
   */
  const savingsPercentage = useMemo(() => {
    if (calculation.deliveryCost <= 0) return 0;
    return (savings / calculation.deliveryCost) * 100;
  }, [savings, calculation.deliveryCost]);

  /**
   * Determine if pickup is worth it
   */
  const isWorthIt = useMemo(() => {
    return savings > 0;
  }, [savings]);

  /**
   * Handle MPG edit start
   */
  const handleEditMpg = useCallback(() => {
    if (editable) {
      setIsEditingMpg(true);
    }
  }, [editable]);

  /**
   * Handle MPG save
   */
  const handleSaveMpg = useCallback((newMpg: number) => {
    setLocalMpg(newMpg);
    setIsEditingMpg(false);
    
    if (onMpgChange) {
      onMpgChange(newMpg);
    }

    // Save to settings if callback provided
    if (onSaveSettings) {
      const settings: UserSettings = {
        mpg: newMpg,
        gasPrice: localGasPrice,
        defaultMpg: newMpg,
        autoSave: true,
        showTimeCalculation: true,
        showDetailedBreakdown: true
      };
      onSaveSettings(settings);
    }
  }, [onMpgChange, onSaveSettings, localGasPrice]);

  /**
   * Handle MPG cancel
   */
  const handleCancelMpg = useCallback(() => {
    setLocalMpg(calculation.mpg);
    setIsEditingMpg(false);
  }, [calculation.mpg]);

  /**
   * Handle gas price change
   */
  const handleGasPriceChange = useCallback((newPrice: number) => {
    setLocalGasPrice(newPrice);
  }, []);

  // Show loading state
  if (loading) {
    return <LoadingState className={className} />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} className={className} />;
  }

  // Create updated calculation data
  const updatedCalculation: GasCalculationData = {
    ...calculation,
    mpg: localMpg,
    gasPrice: localGasPrice,
    gasCost: calculatedGasCost,
    totalPickupCost,
    savings,
    savingsPercentage
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-xl">⛽</span>
            <h3 className="text-lg font-semibold text-blue-900">Gas Cost Analysis</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isWorthIt 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isWorthIt ? 'Worth It' : 'Not Worth It'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Distance and Route Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Route Information</h4>
            {showMap && (
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Map →
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Round Trip Distance</div>
              <div className="text-lg font-semibold text-gray-900">
                {calculation.distance.toFixed(1)} miles
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {calculation.totalTime} minutes
              </div>
            </div>
          </div>

          {showMap && (
            <div className="mt-3">
              <RouteMap
                distance={calculation.distance}
                timeToPickup={calculation.timeToPickup}
                restaurantName="Restaurant"
                className="h-32"
              />
            </div>
          )}
        </div>

        {/* Gas Cost Breakdown */}
        <GasBreakdown
          calculation={updatedCalculation}
          currency={currency}
          showDetailed={true}
        />

        {/* MPG Editor */}
        {editable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-yellow-900">Vehicle Settings</h4>
              {!isEditingMpg && (
                <button
                  onClick={handleEditMpg}
                  className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
                >
                  Edit MPG
                </button>
              )}
            </div>

            {isEditingMpg ? (
              <MpgEditor
                currentMpg={localMpg}
                onSave={handleSaveMpg}
                onCancel={handleCancelMpg}
              />
            ) : (
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-sm text-yellow-700">Your MPG</div>
                  <div className="text-lg font-semibold text-yellow-900">
                    {localMpg} mpg
                  </div>
                </div>
                <div>
                  <div className="text-sm text-yellow-700">Gas Price</div>
                  <div className="text-lg font-semibold text-yellow-900">
                    ${localGasPrice.toFixed(2)}/gal
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time Calculation */}
        <TimeCalculation
          timeToPickup={calculation.timeToPickup}
          timeToReturn={calculation.timeToReturn}
          totalTime={calculation.totalTime}
        />

        {/* Savings Display */}
        <SavingsDisplay
          savings={savings}
          savingsPercentage={savingsPercentage}
          currency={currency}
          isWorthIt={isWorthIt}
        />

        {/* Cost Comparison */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Cost Comparison</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Total</span>
              <span className="font-semibold text-gray-900">
                ${calculation.deliveryCost.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Pickup Food</span>
              <span className="font-semibold text-gray-900">
                ${calculation.foodCost.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Gas Cost</span>
              <span className="font-semibold text-gray-900">
                ${calculatedGasCost.toFixed(2)}
              </span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Pickup Total</span>
                <span className="font-bold text-lg text-gray-900">
                  ${totalPickupCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`p-4 rounded-lg border ${
          isWorthIt 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {isWorthIt ? '✅' : '❌'}
            </span>
            <div>
              <div className={`font-semibold ${
                isWorthIt ? 'text-green-800' : 'text-red-800'
              }`}>
                {isWorthIt 
                  ? `Pickup is worth it! You'll save $${savings.toFixed(2)}`
                  : `Pickup isn't worth it. You'd lose $${Math.abs(savings).toFixed(2)}`
                }
              </div>
              <div className={`text-sm ${
                isWorthIt ? 'text-green-700' : 'text-red-700'
              }`}>
                {isWorthIt 
                  ? `That's a ${savingsPercentage.toFixed(1)}% savings compared to delivery`
                  : `You'd save $${Math.abs(savings).toFixed(2)} by choosing delivery instead`
                }
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <div className="font-medium text-blue-900 mb-2">Pickup Tips:</div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Call ahead to confirm your order is ready</li>
                <li>• Consider traffic conditions and peak hours</li>
                <li>• Factor in your time value - is the savings worth your time?</li>
                <li>• Check for parking availability at the restaurant</li>
                <li>• Consider combining with other errands</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version of the gas calculator
 * Shows essential information in a smaller format
 */
export const CompactGasCalculator: React.FC<GasCalculatorProps> = ({
  calculation,
  onMpgChange,
  className = '',
  currency = 'USD'
}) => {
  const gasCost = (calculation.distance * calculation.gasPrice) / calculation.mpg;
  const totalPickupCost = calculation.foodCost + gasCost;
  const savings = calculation.deliveryCost - totalPickupCost;
  const isWorthIt = savings > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">⛽</span>
          <span className="font-medium text-gray-900">Gas Cost</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isWorthIt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isWorthIt ? 'Worth It' : 'Not Worth It'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Distance</div>
          <div className="font-semibold">{calculation.distance.toFixed(1)} mi</div>
        </div>
        <div>
          <div className="text-gray-600">Gas Cost</div>
          <div className="font-semibold">${gasCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-600">Total Pickup</div>
          <div className="font-semibold">${totalPickupCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-600">Savings</div>
          <div className={`font-semibold ${isWorthIt ? 'text-green-600' : 'text-red-600'}`}>
            {isWorthIt ? '+' : ''}${savings.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
