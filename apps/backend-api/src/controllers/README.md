# Comparison Controller

A comprehensive Express controller for the `/compare` endpoint that handles food price comparison across multiple platforms with advanced features including caching, performance metrics, and dependency injection.

## Features

- **Dependency Injection**: Clean architecture with service injection
- **Request Validation**: Comprehensive Zod schema validation
- **Error Handling**: Graceful error handling with detailed responses
- **Request Caching**: Intelligent caching with TTL support
- **Performance Metrics**: Request timing and cache hit rate tracking
- **Health Monitoring**: Service health checks and monitoring
- **Type Safety**: Full TypeScript implementation

## Architecture

### Controller Structure

```
ComparisonController
├── comparePrices()           # Main comparison endpoint
├── getComparisonById()       # Retrieve cached comparison
├── clearCache()             # Cache management
├── getPerformanceMetrics()  # Performance monitoring
└── healthCheck()            # Health monitoring
```

### Service Layer

```
ComparisonService
├── comparePrices()          # Core comparison logic
├── getCachedComparison()    # Cache retrieval
├── cacheComparison()        # Cache storage
└── clearCache()            # Cache management
```

## Usage

### Basic Implementation

```typescript
import { ComparisonController, ComparisonControllerContainer } from '@/controllers/ComparisonController.js';
import { ComparisonService } from '@/services/ComparisonService.js';

// Initialize service and controller
const comparisonService = new ComparisonService();
const container = ComparisonControllerContainer.getInstance();
container.registerComparisonService(comparisonService);
const comparisonController = container.getComparisonController();
```

### Route Integration

```typescript
import { Router } from 'express';
import { ComparisonController, ComparisonControllerContainer } from '@/controllers/ComparisonController.js';
import { ComparisonService } from '@/services/ComparisonService.js';

const router = Router();

// Initialize controller
const comparisonService = new ComparisonService();
const container = ComparisonControllerContainer.getInstance();
container.registerComparisonService(comparisonService);
const comparisonController = container.getComparisonController();

// Routes
router.post('/compare', 
  optionalAuth,
  createValidator({ body: comparisonRequestSchema }),
  asyncHandler(comparisonController.comparePrices.bind(comparisonController))
);

router.get('/:id', 
  optionalAuth,
  asyncHandler(comparisonController.getComparisonById.bind(comparisonController))
);

router.delete('/cache', 
  authenticate,
  asyncHandler(comparisonController.clearCache.bind(comparisonController))
);
```

## API Endpoints

### POST /compare

**Purpose**: Compare food prices across platforms

**Request Body**:
```json
{
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 15.99,
      "category": "Pizza",
      "modifiers": ["Extra Cheese", "Gluten-Free Crust"]
    }
  ],
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY 10001"
  },
  "deliveryAddress": {
    "street": "456 Oak Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "preferredPlatforms": ["doordash", "ubereats"],
  "includePickup": true,
  "includeGasCalculation": true,
  "userPreferences": {
    "maxDeliveryDistance": 10,
    "maxDeliveryTime": 60,
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "priceRange": "$$",
    "currency": "USD",
    "mpg": 25,
    "gasPrice": 3.50,
    "includeTimeValue": false,
    "hourlyRate": 25.00
  }
}
```

**Response**:
```json
{
  "comparisonId": "comp_1234567890_abcdef123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalItems": 2,
  "totalValue": 31.98,
  "platforms": [
    {
      "platform": "doordash",
      "available": true,
      "delivery": {
        "available": true,
        "price": 31.98,
        "deliveryFee": 3.99,
        "serviceFee": 2.50,
        "tax": 2.10,
        "total": 40.57,
        "estimatedTime": 35,
        "restaurant": {
          "id": "rest_1",
          "name": "Mario's Pizza",
          "rating": 4.5,
          "distance": 1.2,
          "cuisine": "Italian"
        }
      },
      "pickup": {
        "available": true,
        "price": 31.98,
        "estimatedTime": 20,
        "restaurant": {
          "id": "rest_1",
          "name": "Mario's Pizza",
          "rating": 4.5,
          "distance": 1.2,
          "cuisine": "Italian"
        }
      },
      "gasCalculation": {
        "distance": 2.4,
        "gasCost": 0.85,
        "totalPickupCost": 32.83,
        "savings": 7.74,
        "isWorthIt": true
      }
    }
  ],
  "recommendations": [
    {
      "platform": "doordash",
      "reason": "Best overall value with lowest total cost",
      "savings": 2.50,
      "timeSavings": 5,
      "confidence": 0.9
    }
  ],
  "metadata": {
    "searchRadius": 10,
    "searchTime": 150,
    "cacheHit": false,
    "requestId": "req_1234567890_abcdef123",
    "userId": "user_123"
  }
}
```

### GET /:id

**Purpose**: Retrieve cached comparison result

**Parameters**:
- `id`: Comparison ID (format: `comp_1234567890_abcdef123`)

**Response**: Same as POST /compare response

### DELETE /cache

**Purpose**: Clear cache

**Query Parameters**:
- `cacheKey` (optional): Specific cache key to clear

**Response**:
```json
{
  "message": "Cache cleared successfully",
  "cacheKey": "all",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abcdef123"
}
```

### GET /metrics

**Purpose**: Get performance metrics

**Response**:
```json
{
  "metrics": {
    "cacheSize": 150,
    "cacheHitRate": 0.75,
    "averageProcessingTime": 120
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abcdef123"
}
```

### GET /health

**Purpose**: Health check

**Response**:
```json
{
  "status": "healthy",
  "cacheSize": 150,
  "serviceAvailable": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abcdef123"
}
```

## Validation

### Request Validation Schema

```typescript
const comparisonRequestSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(10),
    price: z.number().min(0),
    category: z.string().optional(),
    modifiers: z.array(z.string()).optional(),
  })).min(1).max(20),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  deliveryAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().min(2).max(2).default('US'),
  }),
  preferredPlatforms: z.array(z.enum(['doordash', 'ubereats', 'grubhub'])).optional(),
  includePickup: z.boolean().default(true),
  includeGasCalculation: z.boolean().default(true),
  userPreferences: z.object({
    maxDeliveryDistance: z.number().min(0.1).max(50).default(10),
    maxDeliveryTime: z.number().min(5).max(120).default(60),
    dietaryRestrictions: z.array(z.string()).optional(),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
    mpg: z.number().min(10).max(50).optional(),
    gasPrice: z.number().min(0.5).max(10.0).optional(),
    includeTimeValue: z.boolean().default(false),
    hourlyRate: z.number().min(0).max(1000).optional(),
  }).optional(),
});
```

### Validation Features

- **Type Safety**: Strong typing with Zod schemas
- **Range Validation**: Min/max value constraints
- **Format Validation**: Regex patterns for specific fields
- **Array Validation**: Length and content validation
- **Optional Fields**: Flexible validation with defaults
- **Nested Validation**: Complex object structure validation

## Caching

### Cache Key Generation

Cache keys are generated based on:
- User ID (if authenticated)
- Items (name, quantity, price)
- Location (rounded coordinates)
- Delivery address (zip code, city, state)
- Platform preferences
- User preferences (MPG, gas price, etc.)

### Cache Features

- **TTL Support**: Configurable time-to-live (default: 5 minutes)
- **Intelligent Keys**: Consistent key generation for similar requests
- **Cache Hit Tracking**: Performance metrics for cache efficiency
- **Selective Clearing**: Clear specific keys or all cache
- **Memory Management**: Automatic cleanup of expired entries

### Cache Implementation

```typescript
// Generate cache key
const cacheKey = this.generateCacheKey(validatedData, userId);

// Check cache
const cachedResult = await this.comparisonService.getCachedComparison(cacheKey);
if (cachedResult) {
  return res.status(200).json(cachedResult);
}

// Cache result
await this.comparisonService.cacheComparison(cacheKey, result);
```

## Error Handling

### Error Types

1. **Validation Errors**: Zod schema validation failures
2. **Service Errors**: Comparison service failures
3. **Cache Errors**: Cache operation failures
4. **Authentication Errors**: User authentication failures
5. **Rate Limiting**: Request throttling errors

### Error Response Format

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "items",
      "message": "Array must contain at least 1 element(s)",
      "code": "too_small"
    }
  ],
  "requestId": "req_1234567890_abcdef123",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Handling Features

- **Graceful Degradation**: Fallback to basic functionality
- **Detailed Logging**: Comprehensive error logging
- **User-Friendly Messages**: Clear error messages
- **Request Tracking**: Error correlation with request IDs
- **Performance Impact**: Minimal performance impact on errors

## Performance Metrics

### Metrics Collected

- **Request Count**: Total number of requests
- **Cache Hit Rate**: Percentage of cache hits
- **Average Processing Time**: Mean request processing time
- **Error Rate**: Percentage of failed requests
- **Memory Usage**: Cache size and memory consumption

### Performance Monitoring

```typescript
// Get performance metrics
const metrics = controller.getPerformanceMetrics();
console.log(metrics);
// {
//   cacheSize: 150,
//   cacheHitRate: 0.75,
//   averageProcessingTime: 120
// }
```

### Performance Optimization

- **Request Caching**: Reduce redundant API calls
- **Connection Pooling**: Efficient database connections
- **Memory Management**: Automatic cache cleanup
- **Async Processing**: Non-blocking operations
- **Error Recovery**: Graceful error handling

## Testing

### Test Coverage

- **Unit Tests**: Individual method testing
- **Integration Tests**: End-to-end request testing
- **Error Testing**: Error scenario validation
- **Performance Testing**: Load and stress testing
- **Cache Testing**: Cache behavior validation

### Test Examples

```typescript
describe('ComparisonController', () => {
  it('should compare prices successfully', async () => {
    const request = {
      body: {
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        location: { lat: 40.7128, lng: -74.0060 },
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      },
    };

    await controller.comparePrices(request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        comparisonId: expect.any(String),
        platforms: expect.any(Array),
      })
    );
  });
});
```

## Dependencies

### Required Dependencies

- **Express**: Web framework
- **Zod**: Schema validation
- **Winston**: Logging
- **TypeScript**: Type safety

### Service Dependencies

- **ComparisonService**: Core comparison logic
- **CacheService**: Caching functionality
- **Logger**: Logging service
- **AuthService**: Authentication service

## Configuration

### Environment Variables

```bash
# Cache configuration
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Performance monitoring
METRICS_ENABLED=true
PERFORMANCE_LOGGING=true

# Service configuration
COMPARISON_SERVICE_URL=https://api.comparison.com
COMPARISON_SERVICE_TIMEOUT=30000
```

### Service Configuration

```typescript
const comparisonService = new ComparisonService({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
  },
  performance: {
    metricsEnabled: true,
    loggingEnabled: true,
  },
  api: {
    timeout: 30000,
    retries: 3,
  },
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
- **Authentication**: User authentication
- **Authorization**: Permission-based access control

## Troubleshooting

### Common Issues

1. **Cache Misses**: Check cache key generation
2. **Validation Errors**: Verify request schema
3. **Performance Issues**: Monitor cache hit rates
4. **Memory Leaks**: Check cache cleanup
5. **Service Errors**: Verify service availability

### Debugging

```typescript
// Enable debug logging
logger.level = 'debug';

// Check cache status
const metrics = controller.getPerformanceMetrics();
console.log('Cache size:', metrics.cacheSize);
console.log('Cache hit rate:', metrics.cacheHitRate);

// Health check
const health = await controller.healthCheck();
console.log('Service status:', health.status);
```

## License

MIT License - see LICENSE file for details.
