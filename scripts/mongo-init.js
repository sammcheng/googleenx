// MongoDB initialization script
db = db.getSiblingDB('food-price-comparison');

// Create collections
db.createCollection('fooditems');
db.createCollection('stores');
db.createCollection('prices');
db.createCollection('users');

// Create indexes for better performance
db.fooditems.createIndex({ name: 'text', brand: 'text', description: 'text' });
db.fooditems.createIndex({ category: 1, name: 1 });
db.fooditems.createIndex({ name: 1 });

db.stores.createIndex({ name: 'text', chain: 'text' });
db.stores.createIndex({ 'location.city': 1, 'location.state': 1 });
db.stores.createIndex({ isActive: 1, name: 1 });

db.prices.createIndex({ foodItemId: 1, storeId: 1 });
db.prices.createIndex({ foodItemId: 1, isAvailable: 1, price: 1 });
db.prices.createIndex({ storeId: 1, isAvailable: 1, lastUpdated: -1 });
db.prices.createIndex({ isOnSale: 1, isAvailable: 1 });
db.prices.createIndex({ lastUpdated: -1 });

db.users.createIndex({ email: 1 });

print('Database initialized successfully');
