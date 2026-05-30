# Chrome Extension Popup Component

A comprehensive React TypeScript popup component for the Food Delivery Price Comparison Chrome Extension. This popup displays price comparison results with tabs, loading states, gas calculations, and responsive design.

## Features

- **Data Loading**: Loads comparison data from chrome.storage.local
- **Loading States**: Skeleton UI during data loading
- **Tab Navigation**: "All", "Delivery Only", "Pickup Only" tabs
- **Comparison Table**: Displays all platforms with pricing breakdown
- **Best Deal Highlighting**: Green badges for best deals
- **Gas Calculation**: Detailed pickup cost analysis
- **Responsive Design**: Optimized for 400px width
- **Tailwind CSS**: Modern styling with utility classes

## Architecture

### Core Components

1. **App.tsx**: Main popup component with state management
2. **SkeletonLoader**: Loading state with skeleton UI
3. **ComparisonTable**: Price comparison display
4. **GasCalculation**: Pickup cost analysis
5. **TabNavigation**: Tab switching functionality
6. **Header**: Title, refresh button, and savings display
7. **Footer**: Comparison count and settings link

### Data Flow

```
Chrome Storage → App Component → Tab Filtering → Comparison Display
     ↓              ↓              ↓              ↓
Load Data → Filter Results → Show Comparisons → User Interaction
```

## TypeScript Interfaces

### Core Data Structures

```typescript
interface ComparisonResult {
  id: string;
  originalPlatform: string;
  comparisons: PlatformComparison[];
  timestamp: number;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface PlatformComparison {
  platform: string;
  platformName: string;
  totalPrice: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  isDelivery: boolean;
  isPickup: boolean;
  isBestDeal: boolean;
  savings?: number;
  savingsPercentage?: number;
  // ... more fields
}
```

### Component Props

```typescript
interface ComparisonTableProps {
  comparisons: PlatformComparison[];
  showGasCalculation: boolean;
  userPreferences: UserPreferences;
}

interface GasCalculationProps {
  calculation: GasCalculation;
  totalSavings: number;
  isVisible: boolean;
}
```

## Component Structure

### Main App Component

```typescript
export const App: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    comparisonData: null,
    activeTab: TAB_TYPES.ALL,
    loadingState: { isLoading: true, loadingMessage: 'Loading...' },
    errorState: { hasError: false, errorMessage: '' },
    userPreferences: defaultPreferences,
    filteredComparisons: []
  });

  // Load data, handle tabs, manage state
};
```

### Tab Navigation

```typescript
const createTabData = (): TabData[] => {
  const allCount = state.comparisonData.comparisons.length;
  const deliveryCount = state.comparisonData.comparisons.filter(c => c.isDelivery).length;
  const pickupCount = state.comparisonData.comparisons.filter(c => c.isPickup).length;

  return [
    { id: 'all', label: 'All', count: allCount, isActive: state.activeTab === 'all' },
    { id: 'delivery', label: 'Delivery Only', count: deliveryCount, isActive: state.activeTab === 'delivery' },
    { id: 'pickup', label: 'Pickup Only', count: pickupCount, isActive: state.activeTab === 'pickup' }
  ];
};
```

## Loading States

### Skeleton UI

The popup includes comprehensive skeleton loading states:

```typescript
export const SkeletonLoader: React.FC<{
  message?: string;
  progress?: number;
}> = ({ message, progress }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonBox width="w-8" height="h-8" />
        <SkeletonBox width="w-32" height="h-4" />
      </div>
      
      {/* Tab Navigation Skeleton */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <SkeletonBox width="w-16" height="h-8" />
        <SkeletonBox width="w-20" height="h-8" />
      </div>
      
      {/* Comparison Cards Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ComparisonCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
```

### Loading Messages

```typescript
const LOADING_MESSAGES = {
  LOADING_DATA: 'Loading comparison data...',
  FETCHING_RESULTS: 'Fetching price comparisons...',
  CALCULATING_SAVINGS: 'Calculating savings...',
  UPDATING_RESULTS: 'Updating results...'
} as const;
```

## Tab Functionality

### Tab Types

```typescript
const TAB_TYPES = {
  ALL: 'all',
  DELIVERY_ONLY: 'delivery',
  PICKUP_ONLY: 'pickup'
} as const;
```

### Tab Filtering

```typescript
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
```

## Comparison Display

### Comparison Table

```typescript
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  comparisons,
  showGasCalculation,
  userPreferences
}) => {
  return (
    <div className="space-y-2 p-4">
      {comparisons.map((comparison, index) => (
        <ComparisonCard
          key={`${comparison.platform}-${index}`}
          comparison={comparison}
          showGasCalculation={showGasCalculation}
          userPreferences={userPreferences}
        />
      ))}
    </div>
  );
};
```

### Best Deal Badge

```typescript
export const BestDealBadge: React.FC<BestDealBadgeProps> = ({
  isBestDeal,
  savings,
  savingsPercentage
}) => {
  if (!isBestDeal) return null;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        <span>🏆</span>
        <span>Best Deal</span>
      </div>
      
      {savings && savings > 0 && (
        <div className="text-sm font-semibold text-green-600">
          Save ${savings.toFixed(2)}
          {savingsPercentage && (
            <span className="text-xs text-green-500 ml-1">
              ({savingsPercentage.toFixed(0)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

## Gas Calculation

### Gas Cost Analysis

```typescript
export const GasCalculation: React.FC<GasCalculationProps> = ({
  calculation,
  totalSavings,
  isVisible
}) => {
  if (!isVisible || !calculation) return null;

  const netSavings = totalSavings - calculation.gasCost;
  const isWorthIt = netSavings > 0;

  return (
    <div className="p-4 bg-blue-50 border-t border-blue-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <div className="text-blue-600">⛽</div>
          <h3 className="font-semibold text-blue-900">Gas Cost Analysis</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isWorthIt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isWorthIt ? 'Worth It' : 'Not Worth It'}
          </div>
        </div>

        {/* Gas Cost Breakdown */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Round Trip Distance</div>
              <div className="font-semibold text-gray-900">
                {calculation.distance.toFixed(1)} miles
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Gas Cost</div>
              <div className="font-semibold text-gray-900">
                ${calculation.gasCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Responsive Design

### Popup Dimensions

```typescript
export const POPUP_DIMENSIONS: PopupDimensions = {
  width: 400,
  height: 600,
  maxWidth: 400,
  maxHeight: 600
};
```

### Responsive Classes

```typescript
<div 
  className="w-full h-full bg-gray-50 flex flex-col"
  style={{ 
    width: `${POPUP_DIMENSIONS.width}px`,
    height: `${POPUP_DIMENSIONS.height}px`,
    maxWidth: `${POPUP_DIMENSIONS.maxWidth}px`,
    maxHeight: `${POPUP_DIMENSIONS.maxHeight}px`
  }}
>
```

### Mobile-First Design

- **Grid Layout**: Responsive grid for comparison cards
- **Flexible Typography**: Scalable text sizes
- **Touch-Friendly**: Large touch targets for buttons
- **Overflow Handling**: Proper scrolling for long content

## Tailwind CSS Styling

### Color Scheme

```css
/* Primary Colors */
.bg-blue-600 { background-color: #2563eb; }
.text-blue-600 { color: #2563eb; }

/* Success Colors */
.bg-green-100 { background-color: #dcfce7; }
.text-green-600 { color: #16a34a; }

/* Error Colors */
.bg-red-100 { background-color: #fee2e2; }
.text-red-600 { color: #dc2626; }

/* Neutral Colors */
.bg-gray-50 { background-color: #f9fafb; }
.text-gray-600 { color: #4b5563; }
```

### Component Styling

```typescript
// Comparison Card Styling
<div className={`
  bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md
  ${isBestDeal ? 'border-green-500 bg-green-50' : 'border-gray-200'}
  ${isOriginalPlatform ? 'ring-2 ring-blue-200' : ''}
`}>

// Button Styling
<button className={`
  w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200
  ${isBestDeal 
    ? 'bg-green-600 hover:bg-green-700 text-white' 
    : 'bg-blue-600 hover:bg-blue-700 text-white'
  }
`}>
```

## State Management

### Popup State

```typescript
interface PopupState {
  comparisonData: ComparisonResult | null;
  activeTab: string;
  loadingState: LoadingState;
  errorState: ErrorState;
  userPreferences: UserPreferences;
  filteredComparisons: PlatformComparison[];
}
```

### State Updates

```typescript
const handleTabChange = useCallback((tabId: string) => {
  setState(prev => ({
    ...prev,
    activeTab: tabId
  }));

  if (state.comparisonData) {
    filterComparisons(state.comparisonData.comparisons, tabId);
  }
}, [state.comparisonData, filterComparisons]);
```

## Chrome Storage Integration

### Data Loading

```typescript
const loadComparisonData = useCallback(async () => {
  try {
    setState(prev => ({
      ...prev,
      loadingState: { isLoading: true, loadingMessage: LOADING_MESSAGES.LOADING_DATA }
    }));

    const result = await chrome.storage.local.get(['comparison_results', 'user_preferences']);
    
    if (result.comparison_results) {
      const comparisonData: ComparisonResult = result.comparison_results;
      const userPreferences: UserPreferences = result.user_preferences || state.userPreferences;
      
      setState(prev => ({
        ...prev,
        comparisonData,
        userPreferences,
        loadingState: { isLoading: false, loadingMessage: '' }
      }));
    }
  } catch (error) {
    setState(prev => ({
      ...prev,
      loadingState: { isLoading: false, loadingMessage: '' },
      errorState: { hasError: true, errorMessage: error.message }
    }));
  }
}, [state.activeTab, state.userPreferences]);
```

### Storage Listeners

```typescript
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
```

## Testing

### Test Coverage

The popup includes comprehensive tests for:

- **Component Rendering**: All components render correctly
- **Data Loading**: Storage integration and error handling
- **Tab Navigation**: Tab switching and filtering
- **User Interactions**: Button clicks and navigation
- **Responsive Design**: Layout and styling
- **Error States**: Error handling and recovery

### Test Scenarios

```typescript
describe('App Component', () => {
  it('should show loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Loading comparison data...')).toBeInTheDocument();
  });

  it('should load comparison data from storage', async () => {
    mockChrome.storage.local.get.mockResolvedValue({
      comparison_results: mockComparisonResult
    });

    render(<App />);
    await waitFor(() => {
      expect(mockChrome.storage.local.get).toHaveBeenCalled();
    });
  });

  it('should switch tabs when clicked', async () => {
    render(<App />);
    const deliveryTab = screen.getByText('Delivery Only');
    fireEvent.click(deliveryTab);
    expect(deliveryTab).toHaveClass('bg-blue-100');
  });
});
```

## Performance Optimization

### Optimization Strategies

1. **Memoization**: Use React.memo for expensive components
2. **Callback Optimization**: useCallback for event handlers
3. **Lazy Loading**: Load components only when needed
4. **State Batching**: Batch state updates to prevent re-renders
5. **Storage Caching**: Cache frequently accessed data

### Memory Management

- **Cleanup Listeners**: Remove event listeners on unmount
- **State Cleanup**: Clear state when component unmounts
- **Storage Cleanup**: Remove unused storage data
- **Component Unmounting**: Proper cleanup of subscriptions

## Accessibility

### ARIA Support

```typescript
// Proper button labels
<button
  onClick={onRefresh}
  disabled={isLoading}
  title="Refresh comparison"
  aria-label="Refresh comparison data"
>

// Screen reader support
<div role="main" aria-label="Price comparison results">
  <h1>Price Comparison</h1>
  <div role="tablist" aria-label="Comparison tabs">
    <button role="tab" aria-selected={tab.isActive}>
      {tab.label}
    </button>
  </div>
</div>
```

### Keyboard Navigation

- **Tab Order**: Logical tab order for keyboard navigation
- **Focus Management**: Proper focus handling
- **Keyboard Shortcuts**: Support for common shortcuts
- **Screen Reader**: Compatible with screen readers

## Future Enhancements

### Planned Features

1. **Real-time Updates**: Live price updates
2. **Advanced Filtering**: More filter options
3. **Price Alerts**: Notifications for price changes
4. **User Preferences**: More customization options
5. **Analytics**: Usage tracking and insights

### Performance Improvements

1. **Virtual Scrolling**: For large comparison lists
2. **Image Optimization**: Optimized platform icons
3. **Bundle Splitting**: Code splitting for faster loading
4. **Caching**: Intelligent data caching
5. **Offline Support**: Offline functionality

## Contributing

When contributing to the popup component:

1. **Test Coverage**: Add tests for new features
2. **Accessibility**: Ensure accessibility compliance
3. **Performance**: Consider performance impact
4. **Documentation**: Update documentation
5. **Styling**: Follow Tailwind CSS conventions

## License

This popup component is part of the Food Delivery Price Comparison Chrome Extension and follows the same license terms.
