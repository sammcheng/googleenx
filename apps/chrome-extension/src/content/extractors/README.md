# Uber Eats Cart Data Extractor

A comprehensive TypeScript class for extracting cart data from Uber Eats checkout pages. This extractor follows the same interface as the DoorDash extractor for consistency and includes robust error handling, retry logic, and Uber Eats specific features.

## Features

- **Platform Detection**: Automatically detects Uber Eats checkout pages
- **Comprehensive Data Extraction**: Extracts restaurant info, cart items, pricing, and delivery information
- **Retry Logic**: Handles dynamic content loading with configurable retry attempts
- **Uber Eats Specific Features**: Extracts promo codes, Uber One membership status, and delivery options
- **Robust Error Handling**: Graceful fallbacks for missing or malformed data
- **Validation**: Ensures extracted data meets quality standards
- **Testing**: Comprehensive test suite with mocked DOM scenarios

## Usage

```typescript
import { UberEatsExtractor } from './UberEatsExtractor';

const extractor = new UberEatsExtractor();

// Check if current page is a checkout page
if (extractor.isCheckoutPage()) {
  // Extract complete cart data
  const cartData = await extractor.extractCartData();
  
  if (cartData) {
    console.log('Restaurant:', cartData.restaurant.name);
    console.log('Items:', cartData.items.length);
    console.log('Total:', cartData.total);
  }
}
```

## Extracted Data Structure

The extractor returns a `CartData` object with the following structure:

```typescript
interface CartData {
  platform: 'ubereats';
  restaurant: {
    name: string;
    id?: string;
    rating?: number;
    deliveryTime?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
    modifiers?: string[];
  }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  total: number;
  deliveryInfo: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
  url: string;
  timestamp: Date;
}
```

## Supported Pages

The extractor works on the following Uber Eats pages:

- **Checkout Page**: `/checkout` - Main checkout flow
- **Cart Page**: `/cart` - Shopping cart view
- **Order Page**: `/order` - Order confirmation
- **Review Page**: `/review` - Order review before payment

## Uber Eats Specific Features

### Promo Codes
Extracts active promo codes and discount information:

```typescript
const features = await extractor.extractUberEatsFeatures();
console.log('Promo Code:', features.promoCode); // "SAVE10"
```

### Uber One Membership
Detects if user has active Uber One membership:

```typescript
const features = await extractor.extractUberEatsFeatures();
console.log('Uber One Active:', features.uberOneActive); // true/false
```

### Delivery Options
Extracts selected delivery method:

```typescript
const features = await extractor.extractUberEatsFeatures();
console.log('Delivery Option:', features.deliveryOption); // "Standard Delivery"
```

## Selectors and Data Extraction

The extractor uses a comprehensive set of selectors to handle Uber Eats' dynamic DOM structure:

### Restaurant Information
- **Name**: `[data-testid="restaurant-name"]`, `[data-testid="store-name"]`
- **Rating**: `[data-testid="restaurant-rating"]`, `[aria-label*="rating"]`
- **Delivery Time**: `[data-testid="delivery-time"]`, `[data-testid="eta"]`
- **Address**: `[data-testid="restaurant-address"]`

### Cart Items
- **Container**: `[data-testid="cart-item"]`, `[data-testid="order-item"]`
- **Name**: `[data-testid="item-name"]`, `[data-testid="menu-item-name"]`
- **Price**: `[data-testid="item-price"]`, `[data-testid="menu-item-price"]`
- **Quantity**: `[data-testid="item-quantity"]`, `[data-testid="menu-item-quantity"]`
- **Modifiers**: `[data-testid="item-modifiers"]`, `[data-testid="customizations"]`

### Pricing Information
- **Subtotal**: `[data-testid="subtotal"]`, `[data-testid="order-subtotal"]`
- **Delivery Fee**: `[data-testid="delivery-fee"]`, `[data-testid="delivery-charge"]`
- **Service Fee**: `[data-testid="service-fee"]`, `[data-testid="platform-fee"]`
- **Tax**: `[data-testid="tax"]`, `[data-testid="sales-tax"]`
- **Tip**: `[data-testid="tip"]`, `[data-testid="driver-tip"]`
- **Total**: `[data-testid="total"]`, `[data-testid="order-total"]`

### Delivery Information
- **Address**: `[data-testid="delivery-address"]`, `[data-testid="shipping-address"]`
- **Instructions**: `[data-testid="delivery-instructions"]`, `[data-testid="special-instructions"]`

## Retry Logic and Error Handling

The extractor includes robust retry logic to handle dynamic content loading:

### Configuration
- **Max Retries**: 3 attempts (configurable)
- **Retry Delay**: 1000ms between attempts
- **Timeout**: 3000ms for element waiting

### Retry Scenarios
- **Dynamic Content**: Waits for cart items to load
- **Pricing Updates**: Retries until pricing is complete
- **Network Delays**: Handles slow API responses
- **DOM Changes**: Adapts to dynamic page updates

### Error Handling
- **Missing Elements**: Graceful fallbacks for missing data
- **Invalid Selectors**: Skips invalid selectors and tries alternatives
- **Malformed Data**: Validates and cleans extracted data
- **Network Issues**: Retries failed extractions

## Testing

The extractor includes comprehensive tests covering:

### Test Scenarios
- **Checkout Page**: Full checkout flow with all data
- **Cart Page**: Shopping cart view
- **Order Page**: Order confirmation
- **Review Page**: Order review before payment
- **Promo Code Page**: Page with active promo codes
- **Empty Page**: Page with no data
- **Error Cases**: Missing elements and malformed data

### Test Coverage
- **Data Extraction**: All data fields and edge cases
- **Error Handling**: Missing elements and invalid data
- **Retry Logic**: Dynamic content loading
- **Validation**: Data quality and completeness
- **Uber Eats Features**: Promo codes, membership, delivery options

## Performance Considerations

### Optimization Strategies
- **Parallel Extraction**: Extracts data concurrently where possible
- **Element Caching**: Reuses found elements to avoid re-querying
- **Early Validation**: Validates data as it's extracted
- **Timeout Management**: Prevents hanging on slow pages

### Memory Management
- **Element Cleanup**: Removes temporary elements after extraction
- **Observer Cleanup**: Disconnects MutationObservers after use
- **Error Recovery**: Cleans up resources on extraction failure

## Integration with Content Script

The extractor integrates seamlessly with the main content script:

```typescript
// In content script
const extractor = new UberEatsExtractor();

// Check if on Uber Eats checkout page
if (extractor.isCheckoutPage()) {
  // Extract cart data
  const cartData = await extractor.extractCartData();
  
  if (cartData) {
    // Send to background script for comparison
    chrome.runtime.sendMessage({
      type: 'EXTRACTED_CART_DATA',
      data: cartData
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **No Data Extracted**
   - Check if page is actually a checkout page
   - Verify selectors are still valid
   - Check for dynamic content loading

2. **Incomplete Data**
   - Wait for page to fully load
   - Check for missing elements
   - Verify retry logic is working

3. **Invalid Data**
   - Check data validation rules
   - Verify price parsing logic
   - Check for malformed HTML

### Debugging

Use the `getExtractionStats()` method to debug extraction issues:

```typescript
const stats = await extractor.getExtractionStats();
console.log('Extraction Stats:', stats);
// {
//   isCheckoutPage: true,
//   restaurantFound: true,
//   itemsCount: 2,
//   pricingComplete: true,
//   deliveryInfoFound: true
// }
```

## Future Enhancements

### Planned Features
- **Real-time Updates**: Handle live price changes
- **A/B Testing**: Adapt to different page layouts
- **Performance Metrics**: Track extraction performance
- **Error Reporting**: Send extraction errors to analytics

### Selector Updates
- **Dynamic Selectors**: Adapt to page changes
- **Fallback Strategies**: Multiple extraction methods
- **Selector Validation**: Verify selector effectiveness
- **Auto-updates**: Update selectors automatically

## Contributing

When contributing to the Uber Eats extractor:

1. **Test Coverage**: Add tests for new features
2. **Error Handling**: Include proper error handling
3. **Documentation**: Update documentation for changes
4. **Performance**: Consider performance impact
5. **Compatibility**: Ensure backward compatibility

## License

This extractor is part of the Food Delivery Price Comparison Chrome Extension and follows the same license terms.