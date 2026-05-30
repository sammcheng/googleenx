# Comparison Service

A comprehensive TypeScript service that orchestrates price comparison across multiple food delivery platforms with parallel processing, timeout handling, data normalization, and gas cost calculation.

## Features

- **Parallel Processing**: Executes all platform scrapers simultaneously with `Promise.all`
- **Timeout Handling**: 15-second timeout per scraper with graceful failure handling
- **Data Normalization**: Consistent data structure across different platforms
- **Gas Calculation**: Integrated gas cost analysis for pickup options
- **Best Deal Analysis**: Intelligent recommendation system
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Service health checks and monitoring
- **Performance Metrics**: Response time and data quality tracking

## Architecture

### Service Structure

```
ComparisonOrchestrator
├── comparePrices()           # Main comparison orchestration
├── registerScraper()         # Register platform scrapers
├── unregisterScraper()       # Remove platform scrapers
├── getRegisteredScrapers()   # List registered scrapers
└── healthCheck()             # Health monitoring
```

### Platform Scrapers

```
BasePlatformScraper
├── DoorDashScraper          # DoorDash platform integration
├── UberEatsScraper          # Uber Eats platform integration
└── GrubhubScraper           # Grubhub platform integration
```

### Gas Calculator

```
GasCalculator
├── calculateGasCost()        # Gas cost calculation
├── calculateDistance()      # Distance calculation
├── getGasPrice()            # Gas price retrieval
└── validatePreferences()    # User preferences validation
```

## Usage

### Basic Implementation

```typescript
import { ComparisonOrchestrator } from '@/services/ComparisonOrchestrator.js';
import { GasCalculator } from '@/services/GasCalculator.js';
import { DoorDashScraper } from '@/services/scrapers/DoorDashScraper.js';
import { UberEatsScraper } from '@/services/scrapers/UberEatsScraper.js';
import { GrubhubScraper } from '@/services/scrapers/GrubhubScraper.js';

// Initialize services
const gasCalculator = new GasCalculator();
const orchestrator = new ComparisonOrchestrator(gasCalculator);

// Register platform scrapers
orchestrator.registerScraper(new DoorDashScraper({}));
orchestrator.registerScraper(new UberEatsScraper({}));
orchestrator.registerScraper(new GrubhubScraper({}));

// Compare prices
const request: ComparisonRequest = {
  items: [
    { name: 'Margherita Pizza', quantity: 2, price: 15.99, category: 'Pizza' },
  ],
  location: { lat: 40.7128, lng: -74.0060 },
  deliveryAddress: {
    street: '456 Oak Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  },
  preferredPlatforms: ['doordash', 'ubereats', 'grubhub'],
  includePickup: true,
  includeGasCalculation: true,
  userPreferences: {
    mpg: 25,
    gasPrice: 3.50,
    includeTimeValue: false,
  },
};

const result = await orchestrator.comparePrices(request);
```

### Advanced Configuration

```typescript
// Configure scrapers with custom settings
const doorDashScraper = new DoorDashScraper({
  timeout: 20000,        // 20 second timeout
  retries: 5,           // 5 retry attempts
  retryDelay: 2000,     // 2 second delay between retries
  rateLimit: 5,         // 5 requests per minute
  userAgent: 'CustomBot/1.0',
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
  },
});

orchestrator.registerScraper(doorDashScraper);
```

## API Reference

### ComparisonRequest Interface

```typescript
interface ComparisonRequest {
  items: CartItem[];
  location: Location;
  deliveryAddress: DeliveryAddress;
  preferredPlatforms?: string[];
  includePickup?: boolean;
  includeGasCalculation?: boolean;
  userPreferences?: UserPreferences;
}
```

### ComparisonResult Interface

```typescript
interface ComparisonResult {
  comparisonId: string;
  timestamp: string;
  totalItems: number;
  totalValue: number;
  platforms: NormalizedPlatformData[];
  bestDeal: BestDealAnalysis;
  recommendations: DealRecommendation[];
  metadata: ComparisonMetadata;
}
```

### Platform Scraper Interface

```typescript
interface IPlatformScraper {
  platform: string;
  config: ScraperConfig;
  
  scrape(cartData: CartData, location: Location): Promise<ScraperResult>;
  healthCheck(): Promise<boolean>;
  getConfig(): ScraperConfig;
  updateConfig(config: Partial<ScraperConfig>): void;
}
```

## Parallel Processing

### Promise.all Implementation

The service uses `Promise.all` to execute all platform scrapers simultaneously:

```typescript
private async executeScrapersInParallel(
  scrapers: IPlatformScraper[],
  request: ComparisonRequest,
  timeout: number
): Promise<ScraperResult[]> {
  const scraperPromises = scrapers.map(async (scraper) => {
    try {
      const result = await Promise.race([
        scraper.scrape(cartData, request.location),
        this.createTimeoutPromise(timeout, scraper.platform),
      ]);
      return result;
    } catch (error) {
      return this.createErrorResult(scraper.platform, error);
    }
  });

  return Promise.all(scraperPromises);
}
```

### Timeout Handling

Each scraper has a 15-second timeout with graceful failure handling:

```typescript
private createTimeoutPromise(timeout: number, platform: string): Promise<ScraperResult> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Scraper timeout after ${timeout}ms for platform ${platform}`));
    }, timeout);
  });
}
```

### Graceful Failure Handling

Failed scrapers are handled gracefully without affecting other platforms:

```typescript
// Create error entry for failed scrapers
const errorData: NormalizedPlatformData = {
  platform: result.metadata.platform,
  available: false,
  restaurant: { id: '', name: 'Unknown Restaurant' },
  error: result.error || 'Scraper failed',
  metadata: { /* error metadata */ },
};
```

## Data Normalization

### Consistent Data Structure

All platform data is normalized to a consistent structure:

```typescript
interface NormalizedPlatformData {
  platform: string;
  available: boolean;
  restaurant: NormalizedRestaurantInfo;
  delivery?: NormalizedDeliveryOption;
  pickup?: NormalizedPickupOption;
  gasCalculation?: GasCalculationResult;
  specialOffers?: NormalizedSpecialOffer[];
  error?: string;
  metadata: ComparisonMetadata;
}
```

### Data Quality Assessment

Data quality is assessed based on completeness and accuracy:

```typescript
protected assessDataQuality(data: PlatformData): 'high' | 'medium' | 'low' {
  if (!data.available) return 'low';
  
  let qualityScore = 0;
  
  // Check restaurant info completeness
  if (data.restaurant.name) qualityScore += 1;
  if (data.restaurant.rating) qualityScore += 1;
  if (data.restaurant.distance) qualityScore += 1;
  
  // Check delivery option completeness
  if (data.delivery?.available) {
    if (data.delivery.price > 0) qualityScore += 1;
    if (data.delivery.estimatedTime > 0) qualityScore += 1;
    if (data.delivery.total > 0) qualityScore += 1;
  }
  
  if (qualityScore >= 6) return 'high';
  if (qualityScore >= 3) return 'medium';
  return 'low';
}
```

## Gas Cost Calculation

### Gas Calculator Integration

The service integrates with a gas calculator for pickup cost analysis:

```typescript
private async calculateGasCosts(
  platforms: NormalizedPlatformData[],
  request: ComparisonRequest
): Promise<void> {
  for (const platform of platforms) {
    if (platform.pickup?.available && request.userPreferences) {
      try {
        const gasCalculation = await this.gasCalculator.calculateGasCost(
          platform.pickup,
          request.location,
          request.userPreferences,
          platform.delivery?.total
        );
        
        platform.gasCalculation = gasCalculation;
      } catch (error) {
        this.logger.warn('Gas calculation failed', {
          platform: platform.platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
}
```

### Gas Calculation Features

- **Distance Calculation**: Haversine formula for accurate distance
- **Gas Price Integration**: Real-time gas price data
- **MPG Configuration**: User-configurable vehicle efficiency
- **Time Value**: Optional time value calculation
- **Savings Analysis**: Cost comparison between delivery and pickup

## Best Deal Analysis

### Deal Analysis Algorithm

The service analyzes all options to determine the best deals:

```typescript
private analyzeBestDeals(platforms: NormalizedPlatformData[]): BestDealAnalysis {
  const availablePlatforms = platforms.filter(p => p.available);
  const deliveryPlatforms = availablePlatforms.filter(p => p.delivery?.available);
  const pickupPlatforms = availablePlatforms.filter(p => p.pickup?.available);

  // Find best delivery option
  const bestDelivery = deliveryPlatforms.reduce((best, current) => {
    const currentTotal = current.delivery?.total || Infinity;
    const bestTotal = best.delivery?.total || Infinity;
    return currentTotal < bestTotal ? current : best;
  }, deliveryPlatforms[0] || null);

  // Find best pickup option
  const bestPickup = pickupPlatforms.reduce((best, current) => {
    const currentTotal = current.pickup?.price || Infinity;
    const bestTotal = best.pickup?.price || Infinity;
    return currentTotal < bestTotal ? current : best;
  }, pickupPlatforms[0] || null);

  // Calculate savings
  const deliverySavings = this.calculateSavings(deliveryPlatforms, bestDelivery);
  const pickupSavings = this.calculateSavings(pickupPlatforms, bestPickup);

  return {
    bestDelivery,
    bestPickup,
    bestOverall: this.findBestOverall(deliveryPlatforms, pickupPlatforms),
    savings: { delivery: deliverySavings, pickup: pickupSavings, overall: 0 },
    recommendations: [],
    confidence: this.calculateConfidence(platforms),
  };
}
```

### Recommendation Generation

Intelligent recommendations based on analysis:

```typescript
private generateRecommendations(
  platforms: NormalizedPlatformData[],
  bestDeal: BestDealAnalysis
): DealRecommendation[] {
  const recommendations: DealRecommendation[] = [];

  if (bestDeal.bestDelivery) {
    recommendations.push({
      platform: bestDeal.bestDelivery.platform,
      reason: 'Best delivery value with lowest total cost',
      savings: bestDeal.savings.delivery,
      confidence: 0.9,
      type: 'delivery',
      conditions: ['Lowest total cost', 'Delivery available'],
    });
  }

  if (bestDeal.bestPickup) {
    recommendations.push({
      platform: bestDeal.bestPickup.platform,
      reason: 'Best pickup value with potential savings',
      savings: bestDeal.savings.pickup,
      confidence: 0.8,
      type: 'pickup',
      conditions: ['Pickup available', 'Consider gas cost'],
    });
  }

  return recommendations;
}
```

## Error Handling

### Comprehensive Error Handling

The service implements comprehensive error handling at multiple levels:

```typescript
// Scraper-level error handling
try {
  const result = await scraper.scrape(cartData, request.location);
  return result;
} catch (error) {
  this.logger.error('Scraper execution failed', {
    platform: scraper.platform,
    error: error instanceof Error ? error.message : 'Unknown error',
  });

  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    metadata: { /* error metadata */ },
  };
}

// Orchestrator-level error handling
try {
  const result = await this.executeScrapersInParallel(scrapers, request, timeout);
  return result;
} catch (error) {
  this.logger.error('Orchestration failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  throw error;
}
```

### Error Types

1. **Scraper Errors**: Individual platform failures
2. **Timeout Errors**: Scraper timeout failures
3. **Validation Errors**: Input validation failures
4. **Service Errors**: Service unavailability
5. **Network Errors**: Network connectivity issues

### Error Recovery

- **Graceful Degradation**: Continue with available platforms
- **Retry Logic**: Automatic retry with exponential backoff
- **Fallback Options**: Alternative data sources when available
- **Error Logging**: Comprehensive error logging and monitoring

## Performance Metrics

### Metrics Collection

The service tracks comprehensive performance metrics:

```typescript
interface ComparisonMetadata {
  scrapedAt: string;
  responseTime: number;
  cacheHit: boolean;
  retryCount: number;
  errorCount: number;
  dataQuality: 'high' | 'medium' | 'low';
  lastUpdated?: string;
  platform: string;
}
```

### Performance Monitoring

- **Response Time**: Total orchestration time
- **Scraper Performance**: Individual scraper response times
- **Data Quality**: Quality assessment of scraped data
- **Error Rates**: Failure rates and error types
- **Cache Hit Rates**: Caching effectiveness

### Performance Optimization

- **Parallel Processing**: Simultaneous scraper execution
- **Timeout Management**: Efficient timeout handling
- **Memory Management**: Efficient memory usage
- **Connection Pooling**: Reuse of network connections
- **Caching**: Intelligent caching strategies

## Testing

### Test Coverage

Comprehensive test coverage including:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end testing
- **Error Testing**: Error scenario validation
- **Performance Testing**: Load and stress testing
- **Mock Testing**: Mock service testing

### Test Examples

```typescript
describe('ComparisonOrchestrator', () => {
  it('should compare prices across all platforms', async () => {
    const request: ComparisonRequest = {
      items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
      location: { lat: 40.7128, lng: -74.0060 },
      deliveryAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
    };

    const result = await orchestrator.comparePrices(request);

    expect(result).toHaveProperty('comparisonId');
    expect(result).toHaveProperty('platforms');
    expect(result.platforms).toHaveLength(3);
  });

  it('should handle scraper failures gracefully', async () => {
    // Mock scraper to fail
    vi.spyOn(failingScraper, 'scrape').mockRejectedValue(new Error('Scraper failed'));
    
    const result = await orchestrator.comparePrices(request);
    
    expect(result.platforms.some(p => !p.available)).toBe(true);
  });
});
```

## Configuration

### Environment Variables

```bash
# Scraper configuration
SCRAPER_TIMEOUT=15000
SCRAPER_RETRIES=3
SCRAPER_RETRY_DELAY=1000

# Gas calculator configuration
GAS_CALCULATOR_ENABLED=true
DEFAULT_MPG=25
DEFAULT_GAS_PRICE=3.50

# Performance monitoring
METRICS_ENABLED=true
PERFORMANCE_LOGGING=true
```

### Service Configuration

```typescript
const orchestrator = new ComparisonOrchestrator(gasCalculator, {
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 1000,
  enableGasCalculation: true,
  enablePerformanceMetrics: true,
});
```

## Production Considerations

### Scalability

- **Horizontal Scaling**: Multiple service instances
- **Load Balancing**: Request distribution
- **Database Sharding**: Data partitioning
- **CDN Integration**: Content delivery optimization

### Monitoring

- **Health Checks**: Service availability monitoring
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Comprehensive error monitoring
- **Log Aggregation**: Centralized logging

### Security

- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Request throttling
- **Authentication**: Service authentication
- **Authorization**: Permission-based access control

## Troubleshooting

### Common Issues

1. **Scraper Timeouts**: Check network connectivity and scraper configuration
2. **Data Quality Issues**: Verify scraper selectors and data extraction
3. **Performance Issues**: Monitor response times and optimize scrapers
4. **Memory Leaks**: Check for proper cleanup and resource management
5. **Service Errors**: Verify service availability and configuration

### Debugging

```typescript
// Enable debug logging
logger.level = 'debug';

// Check scraper health
const health = await orchestrator.healthCheck();
console.log('Service health:', health);

// Monitor performance
const metrics = result.metadata;
console.log('Response time:', metrics.responseTime);
console.log('Data quality:', metrics.dataQuality);
```

## License

MIT License - see LICENSE file for details.
