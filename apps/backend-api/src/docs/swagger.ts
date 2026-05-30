/**
 * OpenAPI/Swagger documentation for Food Price Comparison API
 * Comprehensive API documentation with examples and schemas
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Food Price Comparison API',
    description: 'Production-ready API for food price comparison Chrome extension with gas cost calculations',
    version: '1.0.0',
    contact: {
      name: 'Food Price Comparison Team',
      email: 'support@foodpricecomparison.com',
      url: 'https://foodpricecomparison.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.foodpricecomparison.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints',
    },
    {
      name: 'Price Comparison',
      description: 'Food price comparison across platforms',
    },
    {
      name: 'Restaurants',
      description: 'Restaurant information and details',
    },
    {
      name: 'Gas Calculation',
      description: 'Gas cost calculations for pickup delivery',
    },
    {
      name: 'User',
      description: 'User preferences and settings',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Basic health check endpoint',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 3600 },
                    environment: { type: 'string', example: 'production' },
                    version: { type: 'string', example: '1.0.0' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Server is unhealthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'unhealthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    error: { type: 'string', example: 'Health check failed' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/detailed': {
      get: {
        tags: ['Health'],
        summary: 'Detailed health check',
        description: 'Comprehensive health check with system metrics',
        responses: {
          '200': {
            description: 'Detailed health information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 3600 },
                    environment: { type: 'string', example: 'production' },
                    version: { type: 'string', example: '1.0.0' },
                    system: {
                      type: 'object',
                      properties: {
                        memory: {
                          type: 'object',
                          properties: {
                            used: { type: 'number', example: 128 },
                            total: { type: 'number', example: 512 },
                            external: { type: 'number', example: 64 },
                            rss: { type: 'number', example: 256 },
                          },
                        },
                        cpu: {
                          type: 'object',
                          properties: {
                            usage: { type: 'object', properties: { user: { type: 'number' }, system: { type: 'number' } } },
                            loadAverage: { type: 'array', items: { type: 'number' } },
                          },
                        },
                        platform: { type: 'string', example: 'linux' },
                        nodeVersion: { type: 'string', example: '18.17.0' },
                        pid: { type: 'number', example: 12345 },
                        arch: { type: 'string', example: 'x64' },
                      },
                    },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'object', properties: { status: { type: 'string', example: 'healthy' } } },
                        redis: { type: 'object', properties: { status: { type: 'string', example: 'healthy' } } },
                        external: { type: 'object', properties: { status: { type: 'string', example: 'healthy' } } },
                      },
                    },
                    responseTime: { type: 'string', example: '45ms' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/compare': {
      post: {
        tags: ['Price Comparison'],
        summary: 'Compare food prices across platforms',
        description: 'Compare food prices across DoorDash, Uber Eats, and Grubhub with gas cost calculations',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items', 'location', 'deliveryAddress'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'Margherita Pizza' },
                        quantity: { type: 'integer', minimum: 1, maximum: 10, example: 2 },
                        price: { type: 'number', minimum: 0, example: 15.99 },
                        category: { type: 'string', example: 'Pizza' },
                        modifiers: { type: 'array', items: { type: 'string' }, example: ['Extra Cheese', 'Gluten-Free Crust'] },
                      },
                    },
                  },
                  location: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', minimum: -90, maximum: 90, example: 40.7128 },
                      lng: { type: 'number', minimum: -180, maximum: 180, example: -74.0060 },
                      address: { type: 'string', example: '123 Main St, New York, NY 10001' },
                    },
                  },
                  deliveryAddress: {
                    type: 'object',
                    properties: {
                      street: { type: 'string', example: '456 Oak Ave' },
                      city: { type: 'string', example: 'New York' },
                      state: { type: 'string', example: 'NY' },
                      zipCode: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$', example: '10001' },
                      country: { type: 'string', default: 'US', example: 'US' },
                    },
                  },
                  preferredPlatforms: {
                    type: 'array',
                    items: { type: 'string', enum: ['doordash', 'ubereats', 'grubhub'] },
                    example: ['doordash', 'ubereats'],
                  },
                  includePickup: { type: 'boolean', default: true },
                  includeGasCalculation: { type: 'boolean', default: true },
                  userPreferences: {
                    type: 'object',
                    properties: {
                      maxDeliveryDistance: { type: 'number', minimum: 0.1, maximum: 50, default: 10 },
                      maxDeliveryTime: { type: 'number', minimum: 5, maximum: 120, default: 60 },
                      dietaryRestrictions: { type: 'array', items: { type: 'string' }, example: ['vegetarian', 'gluten-free'] },
                      priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Price comparison successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    comparisonId: { type: 'string', format: 'uuid' },
                    timestamp: { type: 'string', format: 'date-time' },
                    totalItems: { type: 'integer', example: 3 },
                    totalValue: { type: 'number', example: 45.97 },
                    platforms: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          platform: { type: 'string', enum: ['doordash', 'ubereats', 'grubhub'] },
                          available: { type: 'boolean' },
                          delivery: {
                            type: 'object',
                            properties: {
                              available: { type: 'boolean' },
                              price: { type: 'number' },
                              deliveryFee: { type: 'number' },
                              serviceFee: { type: 'number' },
                              tax: { type: 'number' },
                              total: { type: 'number' },
                              estimatedTime: { type: 'number' },
                              restaurant: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  rating: { type: 'number' },
                                  distance: { type: 'number' },
                                  cuisine: { type: 'string' },
                                },
                              },
                            },
                          },
                          pickup: {
                            type: 'object',
                            properties: {
                              available: { type: 'boolean' },
                              price: { type: 'number' },
                              estimatedTime: { type: 'number' },
                              restaurant: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  rating: { type: 'number' },
                                  distance: { type: 'number' },
                                  cuisine: { type: 'string' },
                                },
                              },
                            },
                          },
                          gasCalculation: {
                            type: 'object',
                            properties: {
                              distance: { type: 'number' },
                              gasCost: { type: 'number' },
                              totalPickupCost: { type: 'number' },
                              savings: { type: 'number' },
                              isWorthIt: { type: 'boolean' },
                            },
                          },
                        },
                      },
                    },
                    recommendations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          platform: { type: 'string' },
                          reason: { type: 'string' },
                          savings: { type: 'number' },
                          timeSavings: { type: 'number' },
                        },
                      },
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        searchRadius: { type: 'number' },
                        searchTime: { type: 'number' },
                        cacheHit: { type: 'boolean' },
                        requestId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation failed' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                          code: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Authentication required' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Too many requests' },
                    retryAfter: { type: 'string', example: '15 minutes' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/restaurants/{id}': {
      get: {
        tags: ['Restaurants'],
        summary: 'Get restaurant details',
        description: 'Retrieve detailed information about a specific restaurant including menu, reviews, and platform availability',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Restaurant ID',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
        ],
        responses: {
          '200': {
            description: 'Restaurant details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: "Mario's Pizza" },
                    description: { type: 'string', example: 'Authentic Italian pizza with fresh ingredients' },
                    cuisine: { type: 'string', example: 'Italian' },
                    rating: { type: 'number', minimum: 0, maximum: 5, example: 4.5 },
                    reviewCount: { type: 'integer', minimum: 0, example: 1247 },
                    priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'], example: '$$' },
                    deliveryTime: { type: 'number', minimum: 5, maximum: 120, example: 35 },
                    deliveryFee: { type: 'number', minimum: 0, example: 3.99 },
                    minimumOrder: { type: 'number', minimum: 0, example: 15.00 },
                    address: {
                      type: 'object',
                      properties: {
                        street: { type: 'string', example: '123 Main St' },
                        city: { type: 'string', example: 'New York' },
                        state: { type: 'string', example: 'NY' },
                        zipCode: { type: 'string', example: '10001' },
                        country: { type: 'string', example: 'US' },
                        coordinates: {
                          type: 'object',
                          properties: {
                            lat: { type: 'number', example: 40.7128 },
                            lng: { type: 'number', example: -74.0060 },
                          },
                        },
                      },
                    },
                    hours: {
                      type: 'object',
                      properties: {
                        monday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '11:00' },
                            close: { type: 'string', example: '22:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                        tuesday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '11:00' },
                            close: { type: 'string', example: '22:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                        wednesday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '11:00' },
                            close: { type: 'string', example: '22:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                        thursday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '11:00' },
                            close: { type: 'string', example: '22:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                        friday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '11:00' },
                            close: { type: 'string', example: '23:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                        saturday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '11:00' },
                            close: { type: 'string', example: '23:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                        sunday: {
                          type: 'object',
                          properties: {
                            open: { type: 'string', example: '12:00' },
                            close: { type: 'string', example: '21:00' },
                            closed: { type: 'boolean', example: false },
                          },
                        },
                      },
                    },
                    images: {
                      type: 'array',
                      items: { type: 'string', format: 'uri' },
                      example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
                    },
                    features: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Delivery', 'Pickup', 'Vegetarian Options', 'Gluten-Free Options'],
                    },
                    dietaryOptions: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'],
                    },
                    platforms: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          platform: { type: 'string', enum: ['doordash', 'ubereats', 'grubhub'] },
                          available: { type: 'boolean' },
                          deliveryFee: { type: 'number' },
                          serviceFee: { type: 'number' },
                          estimatedTime: { type: 'number' },
                        },
                      },
                    },
                    menu: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          price: { type: 'number', minimum: 0 },
                          category: { type: 'string' },
                          image: { type: 'string', format: 'uri' },
                          dietary: { type: 'array', items: { type: 'string' } },
                          allergens: { type: 'array', items: { type: 'string' } },
                          modifiers: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                options: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      id: { type: 'string' },
                                      name: { type: 'string' },
                                      price: { type: 'number', minimum: 0 },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    reviews: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          rating: { type: 'number', minimum: 1, maximum: 5 },
                          comment: { type: 'string' },
                          author: { type: 'string' },
                          date: { type: 'string', format: 'date-time' },
                          helpful: { type: 'integer', minimum: 0 },
                        },
                      },
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        lastUpdated: { type: 'string', format: 'date-time' },
                        source: { type: 'string' },
                        requestId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid restaurant ID',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Invalid restaurant ID format' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Restaurant not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Restaurant not found' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/gas/calculate': {
      post: {
        tags: ['Gas Calculation'],
        summary: 'Calculate gas cost for pickup',
        description: 'Calculate gas cost for pickup delivery including savings comparison and time analysis',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['distance', 'gasPrice', 'mpg', 'foodCost', 'deliveryCost'],
                properties: {
                  distance: {
                    type: 'number',
                    minimum: 0.1,
                    maximum: 100,
                    description: 'Round trip distance in miles',
                    example: 5.0,
                  },
                  gasPrice: {
                    type: 'number',
                    minimum: 0.5,
                    maximum: 10.0,
                    description: 'Gas price per gallon',
                    example: 3.50,
                  },
                  mpg: {
                    type: 'number',
                    minimum: 10,
                    maximum: 50,
                    description: 'Vehicle miles per gallon',
                    example: 25,
                  },
                  foodCost: {
                    type: 'number',
                    minimum: 0,
                    description: 'Pickup food cost',
                    example: 15.50,
                  },
                  deliveryCost: {
                    type: 'number',
                    minimum: 0,
                    description: 'Delivery cost for comparison',
                    example: 19.66,
                  },
                  timeToPickup: {
                    type: 'number',
                    minimum: 1,
                    maximum: 120,
                    description: 'Time to pickup in minutes',
                    example: 15,
                  },
                  timeToReturn: {
                    type: 'number',
                    minimum: 1,
                    maximum: 120,
                    description: 'Time to return in minutes',
                    example: 15,
                  },
                  userPreferences: {
                    type: 'object',
                    properties: {
                      currency: {
                        type: 'string',
                        enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
                        default: 'USD',
                      },
                      showDetailedBreakdown: { type: 'boolean', default: true },
                      includeTimeValue: { type: 'boolean', default: false },
                      hourlyRate: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1000,
                        description: 'Hourly rate for time value calculation',
                        example: 25.00,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Gas calculation successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    calculationId: { type: 'string', format: 'uuid' },
                    timestamp: { type: 'string', format: 'date-time' },
                    input: {
                      type: 'object',
                      properties: {
                        distance: { type: 'number', example: 5.0 },
                        gasPrice: { type: 'number', example: 3.50 },
                        mpg: { type: 'number', example: 25 },
                        foodCost: { type: 'number', example: 15.50 },
                        deliveryCost: { type: 'number', example: 19.66 },
                        timeToPickup: { type: 'number', example: 15 },
                        timeToReturn: { type: 'number', example: 15 },
                      },
                    },
                    calculation: {
                      type: 'object',
                      properties: {
                        gasCost: { type: 'number', example: 0.70 },
                        totalPickupCost: { type: 'number', example: 16.20 },
                        savings: { type: 'number', example: 3.46 },
                        savingsPercentage: { type: 'number', example: 17.6 },
                        isWorthIt: { type: 'boolean', example: true },
                        costPerMile: { type: 'number', example: 0.14 },
                      },
                    },
                    timeAnalysis: {
                      type: 'object',
                      properties: {
                        timeToPickup: { type: 'number', example: 15 },
                        timeToReturn: { type: 'number', example: 15 },
                        totalTime: { type: 'number', example: 30 },
                        timeValue: { type: 'number', example: 12.50 },
                        timeCost: { type: 'number', example: 12.50 },
                      },
                    },
                    breakdown: {
                      type: 'object',
                      properties: {
                        distance: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        gasPrice: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        mpg: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        gasCost: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        foodCost: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        totalPickupCost: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        deliveryCost: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                        savings: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
                      },
                    },
                    recommendations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['pickup', 'delivery'] },
                          reason: { type: 'string' },
                          savings: { type: 'number' },
                          timeSavings: { type: 'number' },
                          confidence: { type: 'number', minimum: 0, maximum: 1 },
                        },
                      },
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        calculationTime: { type: 'number', example: 45 },
                        requestId: { type: 'string' },
                        currency: { type: 'string', example: 'USD' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation failed' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                          code: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/user/preferences': {
      get: {
        tags: ['User'],
        summary: 'Get user preferences',
        description: 'Retrieve user preferences and settings',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User preferences retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    preferences: {
                      type: 'object',
                      properties: {
                        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'], example: 'USD' },
                        language: { type: 'string', example: 'en' },
                        timezone: { type: 'string', example: 'America/New_York' },
                        units: { type: 'string', enum: ['metric', 'imperial'], example: 'imperial' },
                        notifications: {
                          type: 'object',
                          properties: {
                            email: { type: 'boolean', example: true },
                            push: { type: 'boolean', example: true },
                            sms: { type: 'boolean', example: false },
                            priceAlerts: { type: 'boolean', example: true },
                            comparisonResults: { type: 'boolean', example: true },
                            newFeatures: { type: 'boolean', example: false },
                          },
                        },
                        delivery: {
                          type: 'object',
                          properties: {
                            maxDistance: { type: 'number', minimum: 0.1, maximum: 50, example: 10 },
                            maxDeliveryTime: { type: 'number', minimum: 5, maximum: 120, example: 60 },
                            preferredPlatforms: {
                              type: 'array',
                              items: { type: 'string', enum: ['doordash', 'ubereats', 'grubhub'] },
                              example: ['doordash', 'ubereats'],
                            },
                            dietaryRestrictions: {
                              type: 'array',
                              items: { type: 'string' },
                              example: ['vegetarian', 'gluten-free'],
                            },
                            priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'], example: '$$' },
                            autoCompare: { type: 'boolean', example: true },
                          },
                        },
                        gas: {
                          type: 'object',
                          properties: {
                            mpg: { type: 'number', minimum: 10, maximum: 50, example: 25 },
                            gasPrice: { type: 'number', minimum: 0.5, maximum: 10.0, example: 3.50 },
                            includeTimeValue: { type: 'boolean', example: false },
                            hourlyRate: { type: 'number', minimum: 0, maximum: 1000, example: 25.00 },
                            autoCalculate: { type: 'boolean', example: true },
                          },
                        },
                        privacy: {
                          type: 'object',
                          properties: {
                            shareData: { type: 'boolean', example: false },
                            analytics: { type: 'boolean', example: true },
                            personalizedAds: { type: 'boolean', example: false },
                            dataRetention: { type: 'string', enum: ['30', '90', '365', 'forever'], example: '90' },
                          },
                        },
                        accessibility: {
                          type: 'object',
                          properties: {
                            highContrast: { type: 'boolean', example: false },
                            largeText: { type: 'boolean', example: false },
                            screenReader: { type: 'boolean', example: false },
                            keyboardNavigation: { type: 'boolean', example: false },
                          },
                        },
                      },
                    },
                    lastUpdated: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                    metadata: {
                      type: 'object',
                      properties: {
                        requestId: { type: 'string' },
                        source: { type: 'string', example: 'user_preferences_api' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Authentication required' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Update user preferences',
        description: 'Update user preferences and settings',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'], example: 'USD' },
                  language: { type: 'string', example: 'en' },
                  timezone: { type: 'string', example: 'America/New_York' },
                  units: { type: 'string', enum: ['metric', 'imperial'], example: 'imperial' },
                  notifications: {
                    type: 'object',
                    properties: {
                      email: { type: 'boolean', example: true },
                      push: { type: 'boolean', example: true },
                      sms: { type: 'boolean', example: false },
                      priceAlerts: { type: 'boolean', example: true },
                      comparisonResults: { type: 'boolean', example: true },
                      newFeatures: { type: 'boolean', example: false },
                    },
                  },
                  delivery: {
                    type: 'object',
                    properties: {
                      maxDistance: { type: 'number', minimum: 0.1, maximum: 50, example: 10 },
                      maxDeliveryTime: { type: 'number', minimum: 5, maximum: 120, example: 60 },
                      preferredPlatforms: {
                        type: 'array',
                        items: { type: 'string', enum: ['doordash', 'ubereats', 'grubhub'] },
                        example: ['doordash', 'ubereats'],
                      },
                      dietaryRestrictions: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['vegetarian', 'gluten-free'],
                      },
                      priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'], example: '$$' },
                      autoCompare: { type: 'boolean', example: true },
                    },
                  },
                  gas: {
                    type: 'object',
                    properties: {
                      mpg: { type: 'number', minimum: 10, maximum: 50, example: 25 },
                      gasPrice: { type: 'number', minimum: 0.5, maximum: 10.0, example: 3.50 },
                      includeTimeValue: { type: 'boolean', example: false },
                      hourlyRate: { type: 'number', minimum: 0, maximum: 1000, example: 25.00 },
                      autoCalculate: { type: 'boolean', example: true },
                    },
                  },
                  privacy: {
                    type: 'object',
                    properties: {
                      shareData: { type: 'boolean', example: false },
                      analytics: { type: 'boolean', example: true },
                      personalizedAds: { type: 'boolean', example: false },
                      dataRetention: { type: 'string', enum: ['30', '90', '365', 'forever'], example: '90' },
                    },
                  },
                  accessibility: {
                    type: 'object',
                    properties: {
                      highContrast: { type: 'boolean', example: false },
                      largeText: { type: 'boolean', example: false },
                      screenReader: { type: 'boolean', example: false },
                      keyboardNavigation: { type: 'boolean', example: false },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User preferences updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    preferences: {
                      type: 'object',
                      properties: {
                        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'], example: 'USD' },
                        language: { type: 'string', example: 'en' },
                        timezone: { type: 'string', example: 'America/New_York' },
                        units: { type: 'string', enum: ['metric', 'imperial'], example: 'imperial' },
                        notifications: {
                          type: 'object',
                          properties: {
                            email: { type: 'boolean', example: true },
                            push: { type: 'boolean', example: true },
                            sms: { type: 'boolean', example: false },
                            priceAlerts: { type: 'boolean', example: true },
                            comparisonResults: { type: 'boolean', example: true },
                            newFeatures: { type: 'boolean', example: false },
                          },
                        },
                        delivery: {
                          type: 'object',
                          properties: {
                            maxDistance: { type: 'number', minimum: 0.1, maximum: 50, example: 10 },
                            maxDeliveryTime: { type: 'number', minimum: 5, maximum: 120, example: 60 },
                            preferredPlatforms: {
                              type: 'array',
                              items: { type: 'string', enum: ['doordash', 'ubereats', 'grubhub'] },
                              example: ['doordash', 'ubereats'],
                            },
                            dietaryRestrictions: {
                              type: 'array',
                              items: { type: 'string' },
                              example: ['vegetarian', 'gluten-free'],
                            },
                            priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'], example: '$$' },
                            autoCompare: { type: 'boolean', example: true },
                          },
                        },
                        gas: {
                          type: 'object',
                          properties: {
                            mpg: { type: 'number', minimum: 10, maximum: 50, example: 25 },
                            gasPrice: { type: 'number', minimum: 0.5, maximum: 10.0, example: 3.50 },
                            includeTimeValue: { type: 'boolean', example: false },
                            hourlyRate: { type: 'number', minimum: 0, maximum: 1000, example: 25.00 },
                            autoCalculate: { type: 'boolean', example: true },
                          },
                        },
                        privacy: {
                          type: 'object',
                          properties: {
                            shareData: { type: 'boolean', example: false },
                            analytics: { type: 'boolean', example: true },
                            personalizedAds: { type: 'boolean', example: false },
                            dataRetention: { type: 'string', enum: ['30', '90', '365', 'forever'], example: '90' },
                          },
                        },
                        accessibility: {
                          type: 'object',
                          properties: {
                            highContrast: { type: 'boolean', example: false },
                            largeText: { type: 'boolean', example: false },
                            screenReader: { type: 'boolean', example: false },
                            keyboardNavigation: { type: 'boolean', example: false },
                          },
                        },
                      },
                    },
                    lastUpdated: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                    metadata: {
                      type: 'object',
                      properties: {
                        requestId: { type: 'string' },
                        source: { type: 'string', example: 'user_preferences_api' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation failed' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                          code: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Authentication required' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Error message' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
          path: { type: 'string' },
          method: { type: 'string' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
                code: { type: 'string', example: 'invalid_string' },
              },
            },
          },
        },
      },
      RateLimitError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Too many requests' },
          retryAfter: { type: 'string', example: '15 minutes' },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
        },
      },
    },
  },
};

export default swaggerDocument;
