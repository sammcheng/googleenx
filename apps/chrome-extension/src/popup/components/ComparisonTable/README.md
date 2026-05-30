# ComparisonTable Component

A comprehensive, reusable React component for displaying platform comparison data in a table format. Features sorting, highlighting, accessibility, and responsive design.

## Features

- **Sortable Columns**: Click headers to sort by price, time, or other criteria
- **Best Deal Highlighting**: Color-coded best deals with savings indicators
- **Status Indicators**: Visual status for available, unavailable, and limited platforms
- **Platform Logos**: Consistent platform branding and recognition
- **Click to Open**: Click rows to open platforms in new tabs
- **Accessibility**: Full ARIA support and keyboard navigation
- **Responsive Design**: Mobile-optimized layouts
- **Loading States**: Skeleton loading and error handling
- **Tailwind CSS**: Modern utility-first styling

## Usage

### Basic Usage

```tsx
import { ComparisonTable } from './components/ComparisonTable';

const platforms = [
  {
    id: 'doordash',
    name: 'doordash',
    displayName: 'DoorDash',
    logo: '🚚',
    deliveryPrice: 19.66,
    pickupPrice: 15.50,
    deliveryTime: '25-35 min',
    pickupTime: '15-20 min',
    status: 'available',
    isBestDelivery: true,
    isBestPickup: true,
    deliverySavings: 5.00,
    pickupSavings: 3.50,
    url: 'https://www.doordash.com',
    lastUpdated: Date.now()
  }
];

<ComparisonTable platforms={platforms} />
```

### Advanced Usage

```tsx
<ComparisonTable
  platforms={platforms}
  showPickup={true}
  sortable={true}
  highlightBest={true}
  showSavings={true}
  currency="USD"
  onPlatformClick={(platform) => {
    console.log('Clicked platform:', platform.name);
  }}
  className="my-custom-class"
/>
```

## Component Variants

### Standard Table

```tsx
<ComparisonTable platforms={platforms} />
```

### Compact Table

```tsx
<CompactComparisonTable platforms={platforms} />
```

### Mobile Table

```tsx
<MobileComparisonTable platforms={platforms} showPickup={true} />
```

## Props

### ComparisonTableProps

```typescript
interface ComparisonTableProps {
  platforms: PlatformData[];
  showPickup?: boolean;
  onPlatformClick?: (platform: PlatformData) => void;
  className?: string;
  sortable?: boolean;
  highlightBest?: boolean;
  showSavings?: boolean;
  currency?: string;
  loading?: boolean;
  error?: string;
}
```

### PlatformData

```typescript
interface PlatformData {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  deliveryPrice: number;
  pickupPrice?: number;
  deliveryTime: string;
  pickupTime?: string;
  status: PlatformStatus;
  isBestDelivery?: boolean;
  isBestPickup?: boolean;
  deliverySavings?: number;
  pickupSavings?: number;
  url: string;
  lastUpdated: number;
  notes?: string;
}
```

## Sorting

### Sortable Columns

- `deliveryPrice`: Sort by delivery price
- `pickupPrice`: Sort by pickup price
- `deliveryTime`: Sort by delivery time
- `pickupTime`: Sort by pickup time

### Sort Behavior

1. **First Click**: Sort ascending
2. **Second Click**: Sort descending
3. **Third Click**: Remove sorting

```tsx
// Enable sorting
<ComparisonTable platforms={platforms} sortable={true} />

// Disable sorting
<ComparisonTable platforms={platforms} sortable={false} />
```

## Status Indicators

### Platform Status

- `available`: Green indicator with checkmark
- `unavailable`: Red indicator with X (grayed out)
- `limited`: Yellow indicator with warning
- `error`: Gray indicator with question mark

### Status Styling

```typescript
const STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '✅'
  },
  unavailable: {
    label: 'Unavailable',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '❌'
  },
  limited: {
    label: 'Limited',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '⚠️'
  },
  error: {
    label: 'Error',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '❓'
  }
};
```

## Best Deal Highlighting

### Highlighting Features

- **Best Deal Badge**: 🏆 icon for best deals
- **Color Coding**: Green text for best prices
- **Savings Display**: Shows savings amount and percentage
- **Visual Indicators**: Lightning bolt for fastest times

### Highlighting Configuration

```tsx
<ComparisonTable
  platforms={platforms}
  highlightBest={true}
  showSavings={true}
/>
```

## Platform Integration

### Platform Logos

```typescript
const PLATFORM_LOGOS = {
  doordash: '🚚',
  ubereats: '🚗',
  grubhub: '🛵',
  seamless: '🍽️',
  postmates: '📦'
};
```

### Platform URLs

```typescript
const PLATFORM_URLS = {
  doordash: 'https://www.doordash.com',
  ubereats: 'https://www.ubereats.com',
  grubhub: 'https://www.grubhub.com'
};
```

## Accessibility

### ARIA Support

- **Table Role**: `role="table"` for screen readers
- **Row Roles**: `role="row"` for each platform row
- **Column Headers**: `role="columnheader"` for sortable headers
- **Status Roles**: `role="status"` for loading states
- **Alert Roles**: `role="alert"` for error states

### Keyboard Navigation

- **Tab Navigation**: Navigate between rows
- **Enter/Space**: Activate platform links
- **Arrow Keys**: Navigate within table
- **Escape**: Close any open modals

### Screen Reader Support

```tsx
// Proper ARIA labels
<div role="table" aria-label="Platform comparison table">
  <div role="row" aria-label="DoorDash comparison row">
    <div role="columnheader" aria-sort="ascending">
      Delivery Price
    </div>
  </div>
</div>
```

## Responsive Design

### Mobile Optimization

```tsx
// Mobile-optimized layout
<MobileComparisonTable platforms={platforms} showPickup={true} />
```

### Breakpoint Handling

- **Desktop**: Full table layout with all columns
- **Tablet**: Condensed layout with essential columns
- **Mobile**: Card-based layout with vertical stacking

## Loading States

### Skeleton Loading

```tsx
<ComparisonTable platforms={[]} loading={true} />
```

### Error Handling

```tsx
<ComparisonTable platforms={[]} error="Failed to load data" />
```

### Empty State

```tsx
<ComparisonTable platforms={[]} />
```

## Styling

### Tailwind CSS Classes

```tsx
// Custom styling
<ComparisonTable
  platforms={platforms}
  className="border-2 border-blue-200 rounded-xl"
/>
```

### Color Scheme

- **Primary**: Blue for interactive elements
- **Success**: Green for best deals and available status
- **Warning**: Yellow for limited availability
- **Error**: Red for unavailable platforms
- **Neutral**: Gray for disabled states

## Testing

### Test Coverage

```typescript
describe('ComparisonTable', () => {
  it('should render comparison table with platforms', () => {
    render(<ComparisonTable platforms={mockPlatforms} />);
    expect(screen.getByText('DoorDash')).toBeInTheDocument();
  });

  it('should sort by delivery price when header is clicked', async () => {
    render(<ComparisonTable platforms={mockPlatforms} sortable={true} />);
    const header = screen.getByText('Delivery Price');
    fireEvent.click(header);
    expect(screen.getByText('$19.66')).toBeInTheDocument();
  });
});
```

### Test Scenarios

- **Rendering**: All platforms and data display correctly
- **Sorting**: Column sorting works in both directions
- **Highlighting**: Best deals are properly highlighted
- **Status**: Status indicators show correct colors and text
- **Clicks**: Platform clicks trigger correct actions
- **Accessibility**: ARIA labels and keyboard navigation work
- **Responsive**: Layout adapts to different screen sizes

## Performance

### Optimization Strategies

- **Memoization**: React.memo for expensive components
- **Callback Optimization**: useCallback for event handlers
- **State Batching**: Efficient state updates
- **Virtual Scrolling**: For large datasets
- **Lazy Loading**: Load components on demand

### Memory Management

- **Cleanup**: Remove event listeners on unmount
- **State Cleanup**: Clear state when component unmounts
- **Reference Cleanup**: Avoid memory leaks

## Customization

### Custom Styling

```tsx
// Custom CSS classes
<ComparisonTable
  platforms={platforms}
  className="my-custom-table"
/>
```

### Custom Platform Click Handler

```tsx
const handlePlatformClick = (platform: PlatformData) => {
  // Custom logic
  analytics.track('platform_clicked', { platform: platform.name });
  window.open(platform.url, '_blank');
};

<ComparisonTable
  platforms={platforms}
  onPlatformClick={handlePlatformClick}
/>
```

### Custom Currency

```tsx
<ComparisonTable
  platforms={platforms}
  currency="EUR"
/>
```

## Future Enhancements

### Planned Features

1. **Advanced Filtering**: Filter by price range, time, status
2. **Column Customization**: Show/hide columns
3. **Export Functionality**: Export comparison data
4. **Real-time Updates**: Live price updates
5. **Favorites**: Save favorite platforms

### Performance Improvements

1. **Virtual Scrolling**: For large datasets
2. **Lazy Loading**: Load data on demand
3. **Caching**: Cache comparison results
4. **Optimization**: Reduce re-renders

## Contributing

When contributing to the ComparisonTable component:

1. **Test Coverage**: Add tests for new features
2. **Accessibility**: Ensure accessibility compliance
3. **Performance**: Consider performance impact
4. **Documentation**: Update documentation
5. **Styling**: Follow Tailwind CSS conventions

## License

This component is part of the Food Delivery Price Comparison Chrome Extension and follows the same license terms.
