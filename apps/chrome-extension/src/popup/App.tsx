import React, { useState, useEffect, useCallback } from 'react';
import { 
  ComparisonResult, 
  PlatformComparison, 
  UserPreferences, 
  PopupState, 
  TabData,
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  TAB_TYPES,
  POPUP_DIMENSIONS
} from './types';
import { SkeletonLoader } from './components/SkeletonLoader';
import { ComparisonTable } from './components/ComparisonTable';
import { GasCalculation } from './components/GasCalculation';
import { ErrorMessage } from './components/ErrorMessage';
import { TabNavigation } from './components/TabNavigation';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

/**
 * Main popup component for the Chrome extension
 * Displays price comparison results with tabs and responsive design
 */
export const App: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    comparisonData: null,
    activeTab: TAB_TYPES.ALL,
    loadingState: {
      isLoading: true,
      loadingMessage: LOADING_MESSAGES.LOADING_DATA
    },
    errorState: {
      hasError: false,
      errorMessage: ''
    },
    userPreferences: {
      mpg: 25,
      gasPrice: 3.50,
      preferredPlatforms: ['doordash', 'ubereats', 'grubhub'],
      includeGasCalculation: true,
      showPickupOnly: true,
      showDeliveryOnly: true,
      currency: 'USD'
    },
    filteredComparisons: []
  });

  /**
   * Load comparison data from chrome.storage.local
   */
  const loadComparisonData = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        loadingState: {
          isLoading: true,
          loadingMessage: LOADING_MESSAGES.LOADING_DATA
        },
        errorState: {
          hasError: false,
          errorMessage: ''
        }
      }));

      // Check if chrome.storage is available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        throw new Error('Chrome storage not available');
      }

      // Load comparison results
      const result = await chrome.storage.local.get(['comparison_results', 'user_preferences']);
      
      if (result.comparison_results) {
        const comparisonData: ComparisonResult = result.comparison_results;
        
        // Load user preferences if available
        const userPreferences: UserPreferences = result.user_preferences || state.userPreferences;
        
        setState(prev => ({
          ...prev,
          comparisonData,
          userPreferences,
          loadingState: {
            isLoading: false,
            loadingMessage: ''
          }
        }));

        // Filter comparisons based on active tab
        filterComparisons(comparisonData.comparisons, state.activeTab);
      } else {
        setState(prev => ({
          ...prev,
          loadingState: {
            isLoading: false,
            loadingMessage: ''
          },
          errorState: {
            hasError: true,
            errorMessage: ERROR_MESSAGES.NO_DATA
          }
        }));
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      setState(prev => ({
        ...prev,
        loadingState: {
          isLoading: false,
          loadingMessage: ''
        },
        errorState: {
          hasError: true,
          errorMessage: error instanceof Error ? error.message : ERROR_MESSAGES.LOADING_FAILED
        }
      }));
    }
  }, [state.activeTab, state.userPreferences]);

  /**
   * Filter comparisons based on active tab
   */
  const filterComparisons = useCallback((comparisons: PlatformComparison[], activeTab: string) => {
    let filtered: PlatformComparison[] = [];

    switch (activeTab) {
      case TAB_TYPES.DELIVERY_ONLY:
        filtered = comparisons.filter(comp => comp.isDelivery);
        break;
      case TAB_TYPES.PICKUP_ONLY:
        filtered = comparisons.filter(comp => comp.isPickup);
        break;
      default:
        filtered = comparisons;
    }

    setState(prev => ({
      ...prev,
      filteredComparisons: filtered
    }));
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tabId: string) => {
    setState(prev => ({
      ...prev,
      activeTab: tabId
    }));

    if (state.comparisonData) {
      filterComparisons(state.comparisonData.comparisons, tabId);
    }
  }, [state.comparisonData, filterComparisons]);

  /**
   * Handle retry for error state
   */
  const handleRetry = useCallback(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  /**
   * Handle refresh data
   */
  const handleRefresh = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loadingState: {
        isLoading: true,
        loadingMessage: LOADING_MESSAGES.UPDATING_RESULTS
      }
    }));

    // Request fresh comparison from background script
    try {
      await chrome.runtime.sendMessage({
        type: 'REQUEST_COMPARISON',
        data: { refresh: true }
      });
    } catch (error) {
      console.error('Error requesting refresh:', error);
    }

    // Reload data after a short delay
    setTimeout(() => {
      loadComparisonData();
    }, 1000);
  }, [loadComparisonData]);

  /**
   * Initialize component
   */
  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  /**
   * Listen for storage changes
   */
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.comparison_results) {
        loadComparisonData();
      }
    };

    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, [loadComparisonData]);

  /**
   * Create tab data
   */
  const createTabData = (): TabData[] => {
    if (!state.comparisonData) return [];

    const allCount = state.comparisonData.comparisons.length;
    const deliveryCount = state.comparisonData.comparisons.filter(c => c.isDelivery).length;
    const pickupCount = state.comparisonData.comparisons.filter(c => c.isPickup).length;

    return [
      {
        id: TAB_TYPES.ALL,
        label: 'All',
        count: allCount,
        isActive: state.activeTab === TAB_TYPES.ALL
      },
      {
        id: TAB_TYPES.DELIVERY_ONLY,
        label: 'Delivery Only',
        count: deliveryCount,
        isActive: state.activeTab === TAB_TYPES.DELIVERY_ONLY
      },
      {
        id: TAB_TYPES.PICKUP_ONLY,
        label: 'Pickup Only',
        count: pickupCount,
        isActive: state.activeTab === TAB_TYPES.PICKUP_ONLY
      }
    ];
  };

  /**
   * Calculate total savings
   */
  const calculateTotalSavings = (): number => {
    if (!state.filteredComparisons.length) return 0;
    
    const originalPrice = state.filteredComparisons.find(c => c.isOriginalPlatform)?.totalPrice || 0;
    const bestPrice = Math.min(...state.filteredComparisons.map(c => c.totalPrice));
    
    return Math.max(0, originalPrice - bestPrice);
  };

  /**
   * Get gas calculation for pickup options
   */
  const getGasCalculation = () => {
    const pickupComparisons = state.filteredComparisons.filter(c => c.isPickup);
    if (pickupComparisons.length === 0) return null;

    const bestPickup = pickupComparisons.reduce((best, current) => 
      current.totalPrice < best.totalPrice ? current : best
    );

    if (!bestPickup.distance || !state.userPreferences.mpg || !state.userPreferences.gasPrice) {
      return null;
    }

    const gasCost = (bestPickup.distance * 2 * state.userPreferences.gasPrice) / state.userPreferences.mpg;
    
    return {
      distance: bestPickup.distance * 2, // round trip
      mpg: state.userPreferences.mpg,
      gasPrice: state.userPreferences.gasPrice,
      gasCost,
      timeToPickup: bestPickup.estimatedPickupTime ? parseInt(bestPickup.estimatedPickupTime) : 15,
      timeToReturn: 15, // estimated return time
      totalTime: (bestPickup.estimatedPickupTime ? parseInt(bestPickup.estimatedPickupTime) : 15) + 15
    };
  };

  return (
    <div 
      className="w-full h-full bg-gray-50 flex flex-col"
      style={{ 
        width: `${POPUP_DIMENSIONS.width}px`,
        height: `${POPUP_DIMENSIONS.height}px`,
        maxWidth: `${POPUP_DIMENSIONS.maxWidth}px`,
        maxHeight: `${POPUP_DIMENSIONS.maxHeight}px`
      }}
    >
      {/* Header */}
      <Header 
        onRefresh={handleRefresh}
        isLoading={state.loadingState.isLoading}
        totalSavings={calculateTotalSavings()}
      />

      {/* Tab Navigation */}
      <TabNavigation
        tabs={createTabData()}
        onTabChange={handleTabChange}
        isLoading={state.loadingState.isLoading}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {state.loadingState.isLoading ? (
          <SkeletonLoader 
            message={state.loadingState.loadingMessage}
            progress={state.loadingState.progress}
          />
        ) : state.errorState.hasError ? (
          <ErrorMessage
            message={state.errorState.errorMessage}
            onRetry={handleRetry}
            errorCode={state.errorState.errorCode}
          />
        ) : state.filteredComparisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 text-sm">
              {state.activeTab === TAB_TYPES.DELIVERY_ONLY 
                ? 'No delivery options available for this restaurant.'
                : state.activeTab === TAB_TYPES.PICKUP_ONLY
                ? 'No pickup options available for this restaurant.'
                : 'No comparison results available.'
              }
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {/* Comparison Table */}
            <ComparisonTable
              comparisons={state.filteredComparisons}
              showGasCalculation={state.userPreferences.includeGasCalculation}
              userPreferences={state.userPreferences}
            />

            {/* Gas Calculation */}
            {state.userPreferences.includeGasCalculation && state.activeTab === TAB_TYPES.PICKUP_ONLY && (
              <GasCalculation
                calculation={getGasCalculation()}
                totalSavings={calculateTotalSavings()}
                isVisible={state.filteredComparisons.some(c => c.isPickup)}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer
        comparisonCount={state.filteredComparisons.length}
        lastUpdated={state.comparisonData?.timestamp}
        onSettingsClick={() => {
          chrome.runtime.openOptionsPage();
        }}
      />
    </div>
  );
};