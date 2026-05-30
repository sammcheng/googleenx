import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 * Centralized configuration management with environment variable support
 */
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    timeout: parseInt(process.env.SERVER_TIMEOUT || '30000', 10),
  },

  services: {
    persistence: {
      mongodbEnabled: process.env.MONGODB_ENABLED === 'true',
      mongodbRequired: process.env.MONGODB_REQUIRED === 'true',
      redisEnabled: process.env.REDIS_ENABLED === 'true',
      redisRequired: process.env.REDIS_REQUIRED === 'true',
    },
  },

  cors: {
    allowedOrigins: [
      'chrome-extension://*',
      'moz-extension://*',
      'safari-extension://*',
      'ms-browser-extension://*',
      ...(process.env.CORS_ORIGINS?.split(',') || []),
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5173'] : []),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  },

  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/food-price-comparison',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000', 10),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
        bufferMaxEntries: 0,
        bufferCommands: false,
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    },
  },

  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'food-price-comparison-api',
      audience: process.env.JWT_AUDIENCE || 'food-price-comparison-extension',
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    },
    apiKey: {
      header: process.env.API_KEY_HEADER || 'X-API-Key',
      value: process.env.API_KEY_VALUE,
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      filename: process.env.LOG_FILE_NAME || 'logs/app.log',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5', 10),
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_CONSOLE_COLORIZE !== 'false',
    },
  },

  external: {
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
      baseUrl: 'https://maps.googleapis.com/maps/api',
    },
    openWeather: {
      apiKey: process.env.OPENWEATHER_API_KEY,
      baseUrl: 'https://api.openweathermap.org/data/2.5',
    },
    foodDelivery: {
      doordash: {
        baseUrl: process.env.DOORDASH_API_URL || 'https://api.doordash.com',
        apiKey: process.env.DOORDASH_API_KEY,
      },
      ubereats: {
        baseUrl: process.env.UBEREATS_API_URL || 'https://api.ubereats.com',
        apiKey: process.env.UBEREATS_API_KEY,
      },
      grubhub: {
        baseUrl: process.env.GRUBHUB_API_URL || 'https://api.grubhub.com',
        apiKey: process.env.GRUBHUB_API_KEY,
      },
    },
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100', 10),
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10), // 10 minutes
  },

  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: parseInt(process.env.METRICS_PORT || '9090', 10),
    },
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10), // 5 seconds
    },
  },

  features: {
    scraping: {
      enabled: process.env.SCRAPING_ENABLED === 'true',
      userAgent: process.env.SCRAPING_USER_AGENT || 'Food Price Comparison Bot 1.0',
      delay: parseInt(process.env.SCRAPING_DELAY || '1000', 10), // 1 second
      retries: parseInt(process.env.SCRAPING_RETRIES || '3', 10),
    },
    notifications: {
      enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
      email: {
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },
      push: {
        enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
        vapidKeys: {
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY,
        },
      },
    },
  },
} as const;

/**
 * Validate required environment variables
 */
export const validateConfig = (): void => {
  const required: string[] = [];

  if (config.server.nodeEnv === 'production') {
    required.push('JWT_SECRET');
  }

  if (config.services.persistence.mongodbEnabled || config.services.persistence.mongodbRequired) {
    required.push('MONGODB_URI');
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength in production
  if (config.server.nodeEnv === 'production' && config.security.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed in production');
  }
};

/**
 * Get configuration for specific environment
 */
export const getConfig = (env: string = config.server.nodeEnv) => {
  const configs = {
    development: {
      ...config,
      logging: {
        ...config.logging,
        level: 'debug',
        console: { enabled: true, colorize: true },
      },
    },
    production: {
      ...config,
      logging: {
        ...config.logging,
        level: 'info',
        console: { enabled: false, colorize: false },
        file: { enabled: true },
      },
    },
    test: {
      ...config,
      server: { ...config.server, port: 0 },
      database: {
        ...config.database,
        mongodb: {
          ...config.database.mongodb,
          uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/food-price-comparison-test',
        },
      },
      logging: {
        ...config.logging,
        level: 'error',
        console: { enabled: false },
        file: { enabled: false },
      },
    },
  };

  return configs[env as keyof typeof configs] || configs.development;
};
