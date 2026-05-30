# Chrome Extension Background Service Worker (MV3)

A comprehensive TypeScript background service worker for the Food Delivery Price Comparison Chrome Extension. This service worker handles API communication, storage management, popup automation, rate limiting, and error handling.

## Features

- **Message Handling**: Listens for messages from content scripts and popup
- **API Communication**: Makes authenticated requests to backend with retry logic
- **Storage Management**: Stores comparison results in chrome.storage.local
- **Popup Automation**: Automatically opens popup when results are ready
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Error Handling**: Comprehensive error handling with graceful fallbacks
- **Auth Management**: Handles authentication tokens and refresh logic

## Architecture

### Core Components

1. **BackgroundServiceWorker Class**: Main service worker implementation
2. **Message Handlers**: Process different types of messages
3. **API Client**: Handles HTTP requests with retry logic
4. **Storage Manager**: Manages chrome.storage.local operations
5. **Rate Limiter**: Prevents API abuse
6. **Popup Manager**: Automatically opens popup with results

### Message Types

The service worker handles the following message types:

- `EXTRACTED_CART_DATA`: Cart data from content scripts
- `REQUEST_COMPARISON`: Manual comparison requests
- `GET_STORED_RESULTS`: Retrieve stored comparison results
- `CLEAR_STORED_RESULTS`: Clear stored results
- `AUTH_TOKEN_UPDATE`: Update authentication token
- `HEALTH_CHECK`: Service worker health check

## API Configuration

```typescript
const API_CONFIG = {
  baseUrl: 'https://api.foodpricecomparison.com',
  endpoints: {
    compare: '/api/v1/compare',
    auth: '/api/v1/auth/token',
    health: '/api/v1/health'
  },
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000 // 1 second
};
```

## Rate Limiting

The service worker implements rate limiting to prevent API abuse:

```typescript
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  requests: new Map<string, number[]>()
};
```

### Rate Limit Features

- **Request Tracking**: Tracks requests per time window
- **Automatic Cleanup**: Removes old requests automatically
- **Graceful Degradation**: Returns rate limit error when exceeded
- **Configurable Limits**: Easy to adjust limits as needed

## Storage Management

### Storage Keys

```typescript
const STORAGE_KEYS = {
  authToken: 'auth_token',
  comparisonResults: 'comparison_results',
  userPreferences: 'user_preferences',
  rateLimitData: 'rate_limit_data',
  lastComparison: 'last_comparison'
};
```

### Storage Operations

- **Store Results**: Saves comparison results for popup access
- **Retrieve Results**: Gets stored results for display
- **Clear Results**: Removes old results to free space
- **Auth Token**: Manages authentication tokens
- **Preferences**: Stores user preferences

## API Communication

### Request Flow

1. **Validate Cart Data**: Ensure data is complete and valid
2. **Check Rate Limits**: Verify we're not exceeding limits
3. **Ensure Auth Token**: Validate or refresh authentication
4. **Make API Request**: Send request with retry logic
5. **Handle Response**: Process successful responses
6. **Store Results**: Save results for popup access
7. **Open Popup**: Automatically show results to user

### Retry Logic

The service worker implements exponential backoff for failed requests:

```typescript
const delay = API_CONFIG.retryDelay * Math.pow(2, attempt - 1);
```

- **Max Retries**: 3 attempts
- **Exponential Backoff**: 1s, 2s, 4s delays
- **Timeout Handling**: 30-second request timeout
- **Error Recovery**: Graceful handling of network errors

## Popup Management

### Automatic Popup Opening

When comparison results are ready, the service worker:

1. **Stores Results**: Saves results to chrome.storage.local
2. **Opens Popup**: Calls chrome.action.openPopup()
3. **Sends Data**: Popup retrieves results from storage
4. **Fallback**: Shows notification if popup fails

### Popup Communication

```typescript
// Store results for popup
await chrome.storage.local.set({
  comparison_results: results
});

// Open popup
await chrome.action.openPopup();
```

## Error Handling

### Error Types

1. **Network Errors**: API request failures
2. **Auth Errors**: Invalid or expired tokens
3. **Rate Limit Errors**: Too many requests
4. **Storage Errors**: Chrome storage failures
5. **Validation Errors**: Invalid cart data

### Error Recovery

- **Retry Logic**: Automatic retry for transient errors
- **Graceful Degradation**: Fallback to notifications
- **User Feedback**: Clear error messages
- **Logging**: Comprehensive error logging

## Authentication

### Token Management

```typescript
interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}
```

### Auth Flow

1. **Load Token**: Retrieve from chrome.storage.local
2. **Validate Token**: Check expiration
3. **Refresh Token**: Get new token if expired
4. **Store Token**: Save updated token
5. **Use Token**: Include in API requests

## Testing

### Test Coverage

The service worker includes comprehensive tests for:

- **Message Handling**: All message types and responses
- **API Communication**: Success and failure scenarios
- **Rate Limiting**: Within and exceeding limits
- **Storage Management**: Store, retrieve, and clear operations
- **Popup Management**: Success and failure cases
- **Error Handling**: All error types and recovery

### Test Scenarios

```typescript
describe('BackgroundServiceWorker', () => {
  it('should handle EXTRACTED_CART_DATA message', async () => {
    // Test cart data processing
  });
  
  it('should make successful API request', async () => {
    // Test API communication
  });
  
  it('should handle rate limiting', async () => {
    // Test rate limit enforcement
  });
});
```

## Usage Examples

### Basic Usage

```typescript
// Content script sends cart data
chrome.runtime.sendMessage({
  type: 'EXTRACTED_CART_DATA',
  data: cartData
});

// Service worker processes and responds
// Popup automatically opens with results
```

### Manual Comparison

```typescript
// Request comparison manually
chrome.runtime.sendMessage({
  type: 'REQUEST_COMPARISON',
  data: { cartData, preferences }
});
```

### Get Stored Results

```typescript
// Retrieve stored results
chrome.runtime.sendMessage({
  type: 'GET_STORED_RESULTS'
}, (response) => {
  if (response.success) {
    console.log('Results:', response.data);
  }
});
```

## Configuration

### Environment Variables

```typescript
// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.foodpricecomparison.com';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '30000');
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
```

### Rate Limiting

```typescript
// Adjust rate limits
const RATE_LIMIT_CONFIG = {
  maxRequests: 10, // Maximum requests per window
  windowMs: 60000, // Time window in milliseconds
};
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**: Handle multiple requests concurrently
2. **Caching**: Cache auth tokens and results
3. **Cleanup**: Regular cleanup of old data
4. **Debouncing**: Prevent duplicate requests
5. **Lazy Loading**: Load data only when needed

### Memory Management

- **Cleanup Alarms**: Regular cleanup of rate limit data
- **Token Expiry**: Automatic token refresh
- **Storage Limits**: Monitor storage usage
- **Request Queuing**: Queue requests when rate limited

## Security

### Security Features

1. **Token Security**: Secure token storage and transmission
2. **Rate Limiting**: Prevent API abuse
3. **Input Validation**: Validate all incoming data
4. **Error Sanitization**: Don't expose sensitive errors
5. **CSP Compliance**: Follow Content Security Policy

### Best Practices

- **HTTPS Only**: All API requests over HTTPS
- **Token Rotation**: Regular token refresh
- **Input Sanitization**: Clean all user inputs
- **Error Handling**: Don't expose internal errors
- **Logging**: Secure logging without sensitive data

## Troubleshooting

### Common Issues

1. **Popup Not Opening**: Check chrome.action.openPopup() permissions
2. **API Failures**: Verify network connectivity and API status
3. **Rate Limiting**: Wait for rate limit window to reset
4. **Storage Errors**: Check chrome.storage.local permissions
5. **Auth Errors**: Verify token validity and refresh

### Debugging

```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Background service worker debug info');
}
```

### Health Check

```typescript
// Check service worker health
chrome.runtime.sendMessage({
  type: 'HEALTH_CHECK'
}, (response) => {
  console.log('Service worker health:', response.data);
});
```

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket connections for live updates
2. **Offline Support**: Cache results for offline access
3. **Analytics**: Track usage and performance metrics
4. **A/B Testing**: Test different configurations
5. **Machine Learning**: Improve comparison accuracy

### Performance Improvements

1. **Request Batching**: Batch multiple requests
2. **Smart Caching**: Intelligent result caching
3. **Background Sync**: Sync data in background
4. **Compression**: Compress large responses
5. **CDN Integration**: Use CDN for static assets

## Contributing

When contributing to the background service worker:

1. **Test Coverage**: Add tests for new features
2. **Error Handling**: Include proper error handling
3. **Documentation**: Update documentation
4. **Performance**: Consider performance impact
5. **Security**: Follow security best practices

## License

This background service worker is part of the Food Delivery Price Comparison Chrome Extension and follows the same license terms.
