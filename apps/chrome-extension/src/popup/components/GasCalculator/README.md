# GasCalculator Component

A comprehensive React component for calculating and displaying pickup gas cost breakdown with interactive editing, savings comparison, and detailed analysis.

## Features

- **Distance Calculation**: Round trip distance to restaurant
- **Gas Price Tracking**: Current gas price per gallon
- **Vehicle MPG**: Editable MPG with presets and validation
- **Cost Breakdown**: Detailed gas cost calculation
- **Total Cost**: Food cost + gas cost
- **Savings Comparison**: Delivery vs pickup cost analysis
- **Interactive Map**: Optional route visualization
- **Settings Save**: Persistent MPG and gas price settings
- **Responsive Design**: Mobile-optimized layout
- **Tailwind CSS**: Modern utility-first styling

## Usage

### Basic Usage

```tsx
import { GasCalculator } from './components/GasCalculator';

const calculation = {
  distance: 5.0, // miles
  gasPrice: 3.50,
  mpg: 25,
  gasCost: 0.70,
  foodCost: 15.50,
  totalPickupCost: 16.20,
  deliveryCost: 19.66,
  savings: 3.46,
  savingsPercentage: 17.6,
  timeToPickup: 15,
  timeToReturn: 15,
  totalTime: 30
};

<GasCalculator calculation={calculation} />
```

### Advanced Usage

```tsx
<GasCalculator
  calculation={calculation}
  onMpgChange={(mpg) => console.log('MPG changed:', mpg)}
  onSaveSettings={(settings) => saveSettings(settings)}
  showMap={true}
  editable={true}
  currency="USD"
  className="my-custom-class"
/>
```

### Compact Version

```tsx
<CompactGasCalculator calculation={calculation} />
```

## Props

### GasCalculatorProps

```typescript
interface GasCalculatorProps {
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
```

### GasCalculationData

```typescript
interface GasCalculationData {
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
```

## MPG Editor

### Inline Editing

The MPG editor allows users to edit their vehicle's MPG with:

- **Input Validation**: Min/max values with error messages
- **Quick Presets**: Common vehicle types (Economy, SUV, Truck, etc.)
- **Keyboard Support**: Enter to save, Escape to cancel
- **Auto-focus**: Input is focused and selected on open
- **Settings Save**: Automatically saves to user preferences

### MPG Presets

```typescript
const MPG_PRESETS = [
  { label: 'Economy Car', value: 30 },
  { label: 'Compact Car', value: 25 },
  { label: 'SUV', value: 20 },
  { label: 'Truck', value: 15 },
  { label: 'Hybrid', value: 40 },
  { label: 'Electric', value: 0 } // Special case
];
```

### Usage

```tsx
<MpgEditor
  currentMpg={25}
  onSave={(mpg) => handleMpgSave(mpg)}
  onCancel={() => handleMpgCancel()}
/>
```

## Gas Cost Calculation

### Formula

```
Gas Cost = (Distance × Gas Price) ÷ MPG
```

### Example

```
Distance: 5.0 miles
Gas Price: $3.50/gallon
MPG: 25
Gas Cost: (5.0 × $3.50) ÷ 25 = $0.70
```

### Detailed Breakdown

The component shows:

- **Round Trip Distance**: Total miles to restaurant and back
- **Gas Price**: Current price per gallon
- **Vehicle MPG**: User's vehicle efficiency
- **Calculation**: Step-by-step math
- **Total Gas Cost**: Final calculated amount
- **Cost per Mile**: Gas cost divided by distance

## Savings Analysis

### Savings Calculation

```
Savings = Delivery Cost - (Food Cost + Gas Cost)
Savings % = (Savings ÷ Delivery Cost) × 100
```

### Worth It Analysis

- **Positive Savings**: Pickup is worth it
- **Negative Savings**: Delivery is better
- **Visual Indicators**: Color-coded recommendations
- **Percentage Display**: Savings as percentage

### Example

```
Delivery Cost: $19.66
Pickup Food: $15.50
Gas Cost: $0.70
Total Pickup: $16.20
Savings: $3.46 (17.6%)
Recommendation: Pickup is worth it!
```

## Route Map

### Interactive Map Features

- **Route Visualization**: Shows path to restaurant
- **Distance Display**: Total round trip distance
- **Time Estimation**: Drive time to restaurant
- **Map Controls**: Zoom, center, location buttons
- **Restaurant Info**: Name and location details

### Usage

```tsx
<RouteMap
  distance={5.0}
  timeToPickup={15}
  restaurantName="McDonald's"
  className="h-32"
/>
```

## Time Calculation

### Time Breakdown

- **Drive Time**: Time to restaurant
- **Return Time**: Time back home
- **Total Time**: Complete round trip
- **Time Context**: Additional considerations

### Time Considerations

- **Driving Time Only**: Excludes parking and pickup
- **Traffic Conditions**: Factor in peak hours
- **Parking Time**: Add 5-10 minutes
- **Time Value**: Consider your hourly rate

## Settings Management

### User Settings

```typescript
interface UserSettings {
  mpg: number;
  gasPrice: number;
  defaultMpg: number;
  autoSave: boolean;
  showTimeCalculation: boolean;
  showDetailedBreakdown: boolean;
}
```

### Settings Save

```tsx
const handleSaveSettings = (settings: UserSettings) => {
  // Save to chrome.storage.local
  chrome.storage.local.set({ userSettings: settings });
  
  // Or save to your backend
  saveUserSettings(settings);
};
```

## Currency Support

### Supported Currencies

- **USD**: $ (default)
- **EUR**: €
- **GBP**: £
- **CAD**: C$
- **AUD**: A$

### Usage

```tsx
<GasCalculator calculation={calculation} currency="EUR" />
```

## Loading States

### Skeleton Loading

```tsx
<GasCalculator calculation={calculation} loading={true} />
```

### Error Handling

```tsx
<GasCalculator 
  calculation={calculation} 
  error="Failed to calculate gas cost" 
/>
```

## Responsive Design

### Mobile Optimization

- **Compact Layout**: Essential information only
- **Touch-Friendly**: Large touch targets
- **Vertical Stacking**: Information flows vertically
- **Readable Text**: Appropriate font sizes

### Desktop Features

- **Full Layout**: All information visible
- **Interactive Elements**: Hover states and animations
- **Detailed Breakdown**: Complete calculation display
- **Map Integration**: Full route visualization

## Styling

### Tailwind CSS Classes

```tsx
// Main container
<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

// Header
<div className="bg-blue-50 border-b border-blue-200 p-4">

// Content sections
<div className="bg-gray-50 rounded-lg p-4">

// Status indicators
<div className="bg-green-100 text-green-800 rounded-full">
```

### Color Scheme

- **Primary**: Blue for main elements
- **Success**: Green for positive savings
- **Warning**: Yellow for MPG editing
- **Error**: Red for negative savings
- **Info**: Gray for neutral information

## Testing

### Test Coverage

```typescript
describe('GasCalculator', () => {
  it('should render gas calculator with calculation data', () => {
    render(<GasCalculator calculation={mockCalculation} />);
    expect(screen.getByText('Gas Cost Analysis')).toBeInTheDocument();
  });

  it('should show worth it status when savings are positive', () => {
    render(<GasCalculator calculation={mockCalculation} />);
    expect(screen.getByText('Worth It')).toBeInTheDocument();
  });
});
```

### Test Scenarios

- **Rendering**: All components display correctly
- **MPG Editing**: Inline editing works properly
- **Calculations**: Gas cost calculations are accurate
- **Savings**: Savings analysis is correct
- **Settings**: Settings save functionality works
- **Responsive**: Layout adapts to screen size

## Performance

### Optimization Strategies

- **Memoization**: React.memo for expensive components
- **Callback Optimization**: useCallback for event handlers
- **State Batching**: Efficient state updates
- **Lazy Loading**: Load components on demand
- **Caching**: Cache calculation results

### Memory Management

- **Cleanup**: Remove event listeners on unmount
- **State Cleanup**: Clear state when component unmounts
- **Reference Cleanup**: Avoid memory leaks

## Accessibility

### ARIA Support

- **Labels**: Proper labels for all inputs
- **Roles**: Appropriate ARIA roles
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Compatible with screen readers

### Keyboard Support

- **Tab Navigation**: Navigate between elements
- **Enter**: Save MPG changes
- **Escape**: Cancel MPG editing
- **Arrow Keys**: Navigate within inputs

## Future Enhancements

### Planned Features

1. **Real-time Gas Prices**: Live gas price updates
2. **Route Optimization**: Best route suggestions
3. **Traffic Integration**: Real-time traffic data
4. **Multiple Vehicles**: Support for multiple cars
5. **Historical Data**: Track gas cost over time

### Performance Improvements

1. **Caching**: Cache gas price data
2. **Offline Support**: Work without internet
3. **Background Updates**: Update prices in background
4. **Predictive Analysis**: Predict future gas costs

## Contributing

When contributing to the GasCalculator component:

1. **Test Coverage**: Add tests for new features
2. **Accessibility**: Ensure accessibility compliance
3. **Performance**: Consider performance impact
4. **Documentation**: Update documentation
5. **Styling**: Follow Tailwind CSS conventions

## License

This component is part of the Food Delivery Price Comparison Chrome Extension and follows the same license terms.
