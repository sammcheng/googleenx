# Food Price Comparison API

A production-ready Express.js server with TypeScript for the food price comparison Chrome extension.

## Features

- **CORS for Chrome Extension Origins**: Configured for browser extension security
- **Helmet Security Middleware**: Comprehensive security headers and protection
- **Rate Limiting**: Configurable rate limiting with Redis support
- **Request Validation**: Zod schema validation for all endpoints
- **Structured Logging**: Winston logger with multiple transports
- **Health Check Endpoints**: Comprehensive health monitoring
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Graceful Shutdown**: Proper cleanup and resource management
- **Environment Configuration**: Comprehensive environment variable support
- **Modern ES Modules**: Full ES module support with TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB and Redis are optional for the extension compare flow

### Installation

```bash
corepack pnpm install
cp env.example .env
corepack pnpm --filter food-price-comparison-api dev
```

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Security
JWT_SECRET=replace-with-a-long-random-secret

# Optional persistence
MONGODB_ENABLED=false
REDIS_ENABLED=false

# External APIs
GOOGLE_MAPS_API_KEY=
OPENWEATHER_API_KEY=
```

### Production Deploy

- Render Blueprint: [render.yaml](/Users/sammcheng/Desktop/web5/render.yaml)
- Docker image build: [Dockerfile](/Users/sammcheng/Desktop/web5/apps/backend-api/Dockerfile)
- Example env file: [env.example](/Users/sammcheng/Desktop/web5/apps/backend-api/env.example)

The extension-facing compare API can run without MongoDB or Redis. Leave `MONGODB_ENABLED=false` and `REDIS_ENABLED=false` unless you are also deploying persistence-backed routes.

## API Endpoints

### Health Check

```bash
# Basic health check
GET /health

# Detailed health check
GET /health/detailed

# Readiness probe
GET /health/ready

# Liveness probe
GET /health/live
```

### API

```bash
# API information
GET /api/v1

# API status
GET /api/v1/status

# API documentation
GET /api/v1/docs
```

## Architecture

### Folder Structure

```
src/
├── config/           # Configuration files
├── middleware/        # Express middleware
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
├── types/             # TypeScript types
└── index.ts          # Main server file
```

### Key Components

1. **Server Class**: Main server implementation with middleware setup
2. **Configuration**: Centralized config management with environment variables
3. **Middleware**: Security, validation, rate limiting, error handling
4. **Routes**: Modular route organization
5. **Logging**: Structured logging with Winston
6. **Graceful Shutdown**: Proper resource cleanup

## Security Features

### CORS Configuration

```typescript
// Chrome extension origins
allowedOrigins: [
  'chrome-extension://*',
  'moz-extension://*',
  'safari-extension://*',
  'ms-browser-extension://*',
]
```

### Helmet Security

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

### Rate Limiting

- **Default**: 100 requests per 15 minutes
- **Strict**: 5 requests per 15 minutes (auth endpoints)
- **API Key**: 1000 requests per minute
- **Dynamic**: Based on user tier

## Request Validation

### Zod Schemas

```typescript
// Example validation schema
const restaurantSearchSchema = z.object({
  query: z.string().min(1).max(100),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius: z.number().min(0.1).max(50).default(5),
});
```

### Validation Middleware

```typescript
// Create validator for specific schemas
const validator = createValidator({
  body: restaurantSearchSchema,
  query: paginationSchema,
  params: idParamSchema,
});
```

## Logging

### Winston Configuration

```typescript
// Structured logging
logger.info('User action', {
  userId: '123',
  action: 'search',
  query: 'pizza',
  location: { lat: 40.7128, lng: -74.0060 },
});
```

### Log Levels

- **error**: System errors
- **warn**: Warnings and security events
- **info**: General information
- **http**: HTTP requests
- **debug**: Debug information

### Log Transports

- **Console**: Development logging
- **File**: Production log files
- **Error File**: Separate error logs

## Error Handling

### Error Types

```typescript
// Custom error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};
```

### Error Response Format

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abcdef123",
  "path": "/api/v1/users",
  "method": "POST"
}
```

## Rate Limiting

### Configuration

```typescript
// Rate limiting options
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Health Monitoring

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "system": {
    "memory": {
      "used": 128,
      "total": 512,
      "external": 64
    },
    "cpu": {
      "usage": { "user": 1000, "system": 500 }
    }
  },
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "external": { "status": "healthy" }
  }
}
```

## Graceful Shutdown

### Shutdown Process

1. **Signal Handling**: SIGTERM, SIGINT, SIGUSR2
2. **Stop Accepting Connections**: Close server
3. **Cleanup Tasks**: Database, Redis, external connections
4. **Log Flushing**: Ensure all logs are written
5. **Process Exit**: Clean exit with proper status code

### Shutdown Timeout

- **Default**: 30 seconds
- **Configurable**: Via environment variables
- **Force Exit**: If timeout exceeded

## Development

### Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run type-check   # TypeScript type checking
```

### Development Features

- **Hot Reload**: Automatic server restart on file changes
- **TypeScript**: Full type safety
- **ES Modules**: Modern JavaScript modules
- **Path Mapping**: Clean import paths with `@/` alias
- **Source Maps**: Debug support

## Production Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://production-db:27017/food-price-comparison
REDIS_HOST=production-redis
JWT_SECRET=production-secret-key
LOG_FILE_ENABLED=true
```

### Docker Support

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Monitoring

- **Health Checks**: `/health` endpoint
- **Metrics**: `/api/v1/metrics` endpoint
- **Logging**: Structured logs with Winston
- **Error Tracking**: Centralized error handling

## Testing

### Test Structure

```typescript
// Example test
describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
  });
});
```

### Test Coverage

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Error Handling**: Error scenario testing
- **Rate Limiting**: Rate limit testing
- **Security**: Security middleware testing

## Performance

### Optimization Features

- **Compression**: Gzip compression for responses
- **Caching**: Redis-based caching
- **Connection Pooling**: Database connection optimization
- **Rate Limiting**: Request throttling
- **Logging**: Efficient structured logging

### Monitoring

- **Response Times**: Request duration tracking
- **Memory Usage**: Heap and external memory monitoring
- **CPU Usage**: Process CPU usage tracking
- **Error Rates**: Error frequency monitoring

## Security

### Security Headers

- **CSP**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME type sniffing protection
- **X-XSS-Protection**: XSS protection

### Authentication

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **API Keys**: Optional API key authentication
- **Rate Limiting**: Authentication attempt limiting

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check port usage
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   systemctl status mongod
   # Check connection
   mongosh mongodb://localhost:27017
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   systemctl status redis
   # Test connection
   redis-cli ping
   ```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Enable verbose logging
DEBUG=* npm run dev
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Make changes
5. Run tests: `npm test`
6. Run linting: `npm run lint`
7. Submit a pull request

### Code Style

- **ESLint**: Configured for TypeScript
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **ES Modules**: Modern JavaScript modules

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- **Issues**: GitHub Issues
- **Documentation**: README.md
- **API Docs**: `/api/v1/docs` endpoint
- **Health Check**: `/health` endpoint
