import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UberEatsExtractor } from './UberEatsExtractor';
import { CartData } from './types';

// Mock DOM elements
const createMockElement = (tagName: string, attributes: Record<string, string> = {}, textContent = '') => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  element.textContent = textContent;
  return element;
};

const createMockUberEatsCheckoutPage = () => {
  // Clear existing content
  document.body.innerHTML = '';

  // Create checkout page structure
  const checkoutPage = createMockElement('div', { 'data-testid': 'checkout-page' });
  
  // Restaurant information
  const restaurantSection = createMockElement('div', { 'data-testid': 'restaurant-info' });
  const restaurantName = createMockElement('h1', { 'data-testid': 'restaurant-name' }, 'McDonald\'s');
  const restaurantRating = createMockElement('span', { 'data-testid': 'restaurant-rating' }, '4.5');
  const deliveryTime = createMockElement('span', { 'data-testid': 'delivery-time' }, '25-35 min');
  const restaurantAddress = createMockElement('div', { 'data-testid': 'restaurant-address' }, '123 Main St, New York, NY 10001');
  
  restaurantSection.appendChild(restaurantName);
  restaurantSection.appendChild(restaurantRating);
  restaurantSection.appendChild(deliveryTime);
  restaurantSection.appendChild(restaurantAddress);
  
  // Cart items
  const cartSection = createMockElement('div', { 'data-testid': 'cart-section' });
  
  // Item 1: Big Mac
  const item1 = createMockElement('div', { 'data-testid': 'cart-item' });
  const item1Name = createMockElement('h3', { 'data-testid': 'item-name' }, 'Big Mac');
  const item1Price = createMockElement('span', { 'data-testid': 'item-price' }, '$5.99');
  const item1Quantity = createMockElement('span', { 'data-testid': 'item-quantity' }, '1');
  const item1Modifiers = createMockElement('div', { 'data-testid': 'item-modifiers' });
  const modifier1 = createMockElement('span', {}, 'Extra Pickles');
  const modifier2 = createMockElement('span', {}, 'No Onions');
  item1Modifiers.appendChild(modifier1);
  item1Modifiers.appendChild(modifier2);
  
  item1.appendChild(item1Name);
  item1.appendChild(item1Price);
  item1.appendChild(item1Quantity);
  item1.appendChild(item1Modifiers);
  
  // Item 2: French Fries
  const item2 = createMockElement('div', { 'data-testid': 'cart-item' });
  const item2Name = createMockElement('h3', { 'data-testid': 'item-name' }, 'French Fries');
  const item2Price = createMockElement('span', { 'data-testid': 'item-price' }, '$2.99');
  const item2Quantity = createMockElement('span', { 'data-testid': 'item-quantity' }, '2');
  const item2Description = createMockElement('p', { 'data-testid': 'item-description' }, 'Crispy golden fries');
  
  item2.appendChild(item2Name);
  item2.appendChild(item2Price);
  item2.appendChild(item2Quantity);
  item2.appendChild(item2Description);
  
  cartSection.appendChild(item1);
  cartSection.appendChild(item2);
  
  // Pricing section
  const pricingSection = createMockElement('div', { 'data-testid': 'pricing-section' });
  const subtotal = createMockElement('div', { 'data-testid': 'subtotal' }, '$11.97');
  const deliveryFee = createMockElement('div', { 'data-testid': 'delivery-fee' }, '$2.99');
  const serviceFee = createMockElement('div', { 'data-testid': 'service-fee' }, '$1.50');
  const tax = createMockElement('div', { 'data-testid': 'tax' }, '$1.20');
  const tip = createMockElement('div', { 'data-testid': 'tip' }, '$2.00');
  const total = createMockElement('div', { 'data-testid': 'total' }, '$19.66');
  
  pricingSection.appendChild(subtotal);
  pricingSection.appendChild(deliveryFee);
  pricingSection.appendChild(serviceFee);
  pricingSection.appendChild(tax);
  pricingSection.appendChild(tip);
  pricingSection.appendChild(total);
  
  // Checkout button
  const checkoutButton = createMockElement('button', { 'data-testid': 'checkout-button' }, 'Place Order');
  
  // Delivery information
  const deliverySection = createMockElement('div', { 'data-testid': 'delivery-section' });
  const deliveryAddress = createMockElement('div', { 'data-testid': 'delivery-address' }, '456 Oak Ave, New York, NY 10002');
  const deliveryInstructions = createMockElement('div', { 'data-testid': 'delivery-instructions' }, 'Leave at door');
  
  deliverySection.appendChild(deliveryAddress);
  deliverySection.appendChild(deliveryInstructions);
  
  // Assemble page
  checkoutPage.appendChild(restaurantSection);
  checkoutPage.appendChild(cartSection);
  checkoutPage.appendChild(pricingSection);
  checkoutPage.appendChild(deliverySection);
  checkoutPage.appendChild(checkoutButton);
  
  document.body.appendChild(checkoutPage);
  
  // Mock location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.ubereats.com/checkout',
      pathname: '/checkout'
    },
    writable: true
  });
};

const createMockUberEatsCartPage = () => {
  document.body.innerHTML = '';
  
  const cartPage = createMockElement('div', { 'data-testid': 'cart-page' });
  
  // Restaurant info
  const restaurantName = createMockElement('h1', { 'data-testid': 'restaurant-name' }, 'Burger King');
  const restaurantRating = createMockElement('span', { 'data-testid': 'restaurant-rating' }, '4.2');
  
  // Cart items
  const item1 = createMockElement('div', { 'data-testid': 'cart-item' });
  const item1Name = createMockElement('h3', { 'data-testid': 'item-name' }, 'Whopper');
  const item1Price = createMockElement('span', { 'data-testid': 'item-price' }, '$6.99');
  const item1Quantity = createMockElement('span', { 'data-testid': 'item-quantity' }, '1');
  
  item1.appendChild(item1Name);
  item1.appendChild(item1Price);
  item1.appendChild(item1Quantity);
  
  // Pricing
  const subtotal = createMockElement('div', { 'data-testid': 'subtotal' }, '$6.99');
  const deliveryFee = createMockElement('div', { 'data-testid': 'delivery-fee' }, '$2.99');
  const total = createMockElement('div', { 'data-testid': 'total' }, '$9.98');
  
  const checkoutButton = createMockElement('button', { 'data-testid': 'checkout-button' }, 'Checkout');
  
  cartPage.appendChild(restaurantName);
  cartPage.appendChild(restaurantRating);
  cartPage.appendChild(item1);
  cartPage.appendChild(subtotal);
  cartPage.appendChild(deliveryFee);
  cartPage.appendChild(total);
  cartPage.appendChild(checkoutButton);
  
  document.body.appendChild(cartPage);
  
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.ubereats.com/cart',
      pathname: '/cart'
    },
    writable: true
  });
};

const createMockUberEatsOrderPage = () => {
  document.body.innerHTML = '';
  
  const orderPage = createMockElement('div', { 'data-testid': 'order-page' });
  
  // Restaurant info
  const restaurantName = createMockElement('h1', { 'data-testid': 'restaurant-name' }, 'Pizza Hut');
  const restaurantRating = createMockElement('span', { 'data-testid': 'restaurant-rating' }, '4.0');
  
  // Cart items
  const item1 = createMockElement('div', { 'data-testid': 'cart-item' });
  const item1Name = createMockElement('h3', { 'data-testid': 'item-name' }, 'Pepperoni Pizza');
  const item1Price = createMockElement('span', { 'data-testid': 'item-price' }, '$12.99');
  const item1Quantity = createMockElement('span', { 'data-testid': 'item-quantity' }, '1');
  
  item1.appendChild(item1Name);
  item1.appendChild(item1Price);
  item1.appendChild(item1Quantity);
  
  // Pricing
  const subtotal = createMockElement('div', { 'data-testid': 'subtotal' }, '$12.99');
  const deliveryFee = createMockElement('div', { 'data-testid': 'delivery-fee' }, '$2.99');
  const serviceFee = createMockElement('div', { 'data-testid': 'service-fee' }, '$1.30');
  const tax = createMockElement('div', { 'data-testid': 'tax' }, '$1.04');
  const total = createMockElement('div', { 'data-testid': 'total' }, '$18.32');
  
  const checkoutButton = createMockElement('button', { 'data-testid': 'place-order-button' }, 'Place Order');
  
  orderPage.appendChild(restaurantName);
  orderPage.appendChild(restaurantRating);
  orderPage.appendChild(item1);
  orderPage.appendChild(subtotal);
  orderPage.appendChild(deliveryFee);
  orderPage.appendChild(serviceFee);
  orderPage.appendChild(tax);
  orderPage.appendChild(total);
  orderPage.appendChild(checkoutButton);
  
  document.body.appendChild(orderPage);
  
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.ubereats.com/order',
      pathname: '/order'
    },
    writable: true
  });
};

const createMockUberEatsReviewPage = () => {
  document.body.innerHTML = '';
  
  const reviewPage = createMockElement('div', { 'data-testid': 'order-review' });
  
  // Restaurant info
  const restaurantName = createMockElement('h1', { 'data-testid': 'restaurant-name' }, 'KFC');
  const restaurantRating = createMockElement('span', { 'data-testid': 'restaurant-rating' }, '3.8');
  
  // Cart items
  const item1 = createMockElement('div', { 'data-testid': 'cart-item' });
  const item1Name = createMockElement('h3', { 'data-testid': 'item-name' }, 'Original Recipe Chicken');
  const item1Price = createMockElement('span', { 'data-testid': 'item-price' }, '$8.99');
  const item1Quantity = createMockElement('span', { 'data-testid': 'item-quantity' }, '2');
  
  item1.appendChild(item1Name);
  item1.appendChild(item1Price);
  item1.appendChild(item1Quantity);
  
  // Pricing
  const subtotal = createMockElement('div', { 'data-testid': 'subtotal' }, '$17.98');
  const deliveryFee = createMockElement('div', { 'data-testid': 'delivery-fee' }, '$2.99');
  const serviceFee = createMockElement('div', { 'data-testid': 'service-fee' }, '$1.50');
  const tax = createMockElement('div', { 'data-testid': 'tax' }, '$1.44');
  const tip = createMockElement('div', { 'data-testid': 'tip' }, '$3.00');
  const total = createMockElement('div', { 'data-testid': 'total' }, '$26.91');
  
  const checkoutButton = createMockElement('button', { 'data-testid': 'checkout-button' }, 'Place Order');
  
  reviewPage.appendChild(restaurantName);
  reviewPage.appendChild(restaurantRating);
  reviewPage.appendChild(item1);
  reviewPage.appendChild(subtotal);
  reviewPage.appendChild(deliveryFee);
  reviewPage.appendChild(serviceFee);
  reviewPage.appendChild(tax);
  reviewPage.appendChild(tip);
  reviewPage.appendChild(total);
  reviewPage.appendChild(checkoutButton);
  
  document.body.appendChild(reviewPage);
  
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.ubereats.com/review',
      pathname: '/review'
    },
    writable: true
  });
};

const createMockUberEatsWithPromoCode = () => {
  document.body.innerHTML = '';
  
  const checkoutPage = createMockElement('div', { 'data-testid': 'checkout-page' });
  
  // Restaurant info
  const restaurantName = createMockElement('h1', { 'data-testid': 'restaurant-name' }, 'Subway');
  const restaurantRating = createMockElement('span', { 'data-testid': 'restaurant-rating' }, '4.3');
  
  // Cart items
  const item1 = createMockElement('div', { 'data-testid': 'cart-item' });
  const item1Name = createMockElement('h3', { 'data-testid': 'item-name' }, 'Turkey Sub');
  const item1Price = createMockElement('span', { 'data-testid': 'item-price' }, '$7.99');
  const item1Quantity = createMockElement('span', { 'data-testid': 'item-quantity' }, '1');
  
  item1.appendChild(item1Name);
  item1.appendChild(item1Price);
  item1.appendChild(item1Quantity);
  
  // Pricing
  const subtotal = createMockElement('div', { 'data-testid': 'subtotal' }, '$7.99');
  const deliveryFee = createMockElement('div', { 'data-testid': 'delivery-fee' }, '$2.99');
  const serviceFee = createMockElement('div', { 'data-testid': 'service-fee' }, '$1.20');
  const tax = createMockElement('div', { 'data-testid': 'tax' }, '$0.64');
  const total = createMockElement('div', { 'data-testid': 'total' }, '$12.82');
  
  // Promo code
  const promoCode = createMockElement('div', { 'data-testid': 'promo-code' }, 'SAVE10');
  
  // Uber One membership
  const uberOne = createMockElement('div', { 'data-testid': 'uber-one' }, 'Uber One Active');
  
  const checkoutButton = createMockElement('button', { 'data-testid': 'checkout-button' }, 'Place Order');
  
  checkoutPage.appendChild(restaurantName);
  checkoutPage.appendChild(restaurantRating);
  checkoutPage.appendChild(item1);
  checkoutPage.appendChild(subtotal);
  checkoutPage.appendChild(deliveryFee);
  checkoutPage.appendChild(serviceFee);
  checkoutPage.appendChild(tax);
  checkoutPage.appendChild(total);
  checkoutPage.appendChild(promoCode);
  checkoutPage.appendChild(uberOne);
  checkoutPage.appendChild(checkoutButton);
  
  document.body.appendChild(checkoutPage);
  
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.ubereats.com/checkout',
      pathname: '/checkout'
    },
    writable: true
  });
};

describe('UberEatsExtractor', () => {
  let extractor: UberEatsExtractor;

  beforeEach(() => {
    extractor = new UberEatsExtractor();
    vi.clearAllMocks();
  });

  describe('isCheckoutPage', () => {
    it('should detect checkout page by URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.ubereats.com/checkout',
          pathname: '/checkout'
        },
        writable: true
      });
      
      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should detect cart page by URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.ubereats.com/cart',
          pathname: '/cart'
        },
        writable: true
      });
      
      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should detect order page by URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.ubereats.com/order',
          pathname: '/order'
        },
        writable: true
      });
      
      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should detect review page by URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.ubereats.com/review',
          pathname: '/review'
        },
        writable: true
      });
      
      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should detect checkout page by element', () => {
      createMockUberEatsCheckoutPage();
      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should not detect non-checkout pages', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.ubereats.com/restaurant/123',
          pathname: '/restaurant/123'
        },
        writable: true
      });
      
      expect(extractor.isCheckoutPage()).toBe(false);
    });
  });

  describe('extractRestaurantInfo', () => {
    it('should extract restaurant information from checkout page', async () => {
      createMockUberEatsCheckoutPage();
      
      const restaurantInfo = await extractor.extractRestaurantInfo();
      
      expect(restaurantInfo).toBeDefined();
      expect(restaurantInfo?.name).toBe('McDonald\'s');
      expect(restaurantInfo?.rating).toBe(4.5);
      expect(restaurantInfo?.deliveryTime).toBe('25-35 min');
    });

    it('should handle missing restaurant information', async () => {
      document.body.innerHTML = '';
      
      const restaurantInfo = await extractor.extractRestaurantInfo();
      
      expect(restaurantInfo).toBeNull();
    });
  });

  describe('extractCartItems', () => {
    it('should extract cart items from checkout page', async () => {
      createMockUberEatsCheckoutPage();
      
      const items = await extractor.extractCartItems();
      
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        name: 'Big Mac',
        price: 5.99,
        quantity: 1,
        modifiers: ['Extra Pickles', 'No Onions']
      });
      expect(items[1]).toEqual({
        name: 'French Fries',
        price: 2.99,
        quantity: 2,
        description: 'Crispy golden fries'
      });
    });

    it('should handle empty cart', async () => {
      document.body.innerHTML = '';
      
      const items = await extractor.extractCartItems();
      
      expect(items).toHaveLength(0);
    });
  });

  describe('extractPricing', () => {
    it('should extract pricing information from checkout page', async () => {
      createMockUberEatsCheckoutPage();
      
      const pricing = await extractor.extractPricing();
      
      expect(pricing.subtotal).toBe(11.97);
      expect(pricing.deliveryFee).toBe(2.99);
      expect(pricing.serviceFee).toBe(1.50);
      expect(pricing.tax).toBe(1.20);
      expect(pricing.tip).toBe(2.00);
      expect(pricing.total).toBe(19.66);
    });

    it('should handle missing pricing information', async () => {
      document.body.innerHTML = '';
      
      const pricing = await extractor.extractPricing();
      
      expect(pricing.subtotal).toBe(0);
      expect(pricing.deliveryFee).toBe(0);
      expect(pricing.serviceFee).toBe(0);
      expect(pricing.tax).toBe(0);
      expect(pricing.total).toBe(0);
    });
  });

  describe('extractDeliveryInfo', () => {
    it('should extract delivery information from checkout page', async () => {
      createMockUberEatsCheckoutPage();
      
      const deliveryInfo = await extractor.extractDeliveryInfo();
      
      expect(deliveryInfo).toBeDefined();
      expect(deliveryInfo?.address).toBe('456 Oak Ave');
      expect(deliveryInfo?.city).toBe('New York');
      expect(deliveryInfo?.state).toBe('NY');
      expect(deliveryInfo?.zipCode).toBe('10002');
      expect(deliveryInfo?.instructions).toBe('Leave at door');
    });

    it('should handle missing delivery information', async () => {
      document.body.innerHTML = '';
      
      const deliveryInfo = await extractor.extractDeliveryInfo();
      
      expect(deliveryInfo).toBeNull();
    });
  });

  describe('extractCartData', () => {
    it('should extract complete cart data from checkout page', async () => {
      createMockUberEatsCheckoutPage();
      
      const cartData = await extractor.extractCartData();
      
      expect(cartData).toBeDefined();
      expect(cartData?.platform).toBe('ubereats');
      expect(cartData?.restaurant.name).toBe('McDonald\'s');
      expect(cartData?.items).toHaveLength(2);
      expect(cartData?.subtotal).toBe(11.97);
      expect(cartData?.deliveryFee).toBe(2.99);
      expect(cartData?.serviceFee).toBe(1.50);
      expect(cartData?.tax).toBe(1.20);
      expect(cartData?.tip).toBe(2.00);
      expect(cartData?.total).toBe(19.66);
      expect(cartData?.deliveryInfo.address).toBe('456 Oak Ave');
      expect(cartData?.url).toBe('https://www.ubereats.com/checkout');
      expect(cartData?.timestamp).toBeInstanceOf(Date);
    });

    it('should extract cart data from cart page', async () => {
      createMockUberEatsCartPage();
      
      const cartData = await extractor.extractCartData();
      
      expect(cartData).toBeDefined();
      expect(cartData?.platform).toBe('ubereats');
      expect(cartData?.restaurant.name).toBe('Burger King');
      expect(cartData?.items).toHaveLength(1);
      expect(cartData?.items[0].name).toBe('Whopper');
      expect(cartData?.subtotal).toBe(6.99);
      expect(cartData?.deliveryFee).toBe(2.99);
      expect(cartData?.total).toBe(9.98);
    });

    it('should extract cart data from order page', async () => {
      createMockUberEatsOrderPage();
      
      const cartData = await extractor.extractCartData();
      
      expect(cartData).toBeDefined();
      expect(cartData?.platform).toBe('ubereats');
      expect(cartData?.restaurant.name).toBe('Pizza Hut');
      expect(cartData?.items).toHaveLength(1);
      expect(cartData?.items[0].name).toBe('Pepperoni Pizza');
      expect(cartData?.subtotal).toBe(12.99);
      expect(cartData?.deliveryFee).toBe(2.99);
      expect(cartData?.serviceFee).toBe(1.30);
      expect(cartData?.tax).toBe(1.04);
      expect(cartData?.total).toBe(18.32);
    });

    it('should extract cart data from review page', async () => {
      createMockUberEatsReviewPage();
      
      const cartData = await extractor.extractCartData();
      
      expect(cartData).toBeDefined();
      expect(cartData?.platform).toBe('ubereats');
      expect(cartData?.restaurant.name).toBe('KFC');
      expect(cartData?.items).toHaveLength(1);
      expect(cartData?.items[0].name).toBe('Original Recipe Chicken');
      expect(cartData?.items[0].quantity).toBe(2);
      expect(cartData?.subtotal).toBe(17.98);
      expect(cartData?.deliveryFee).toBe(2.99);
      expect(cartData?.serviceFee).toBe(1.50);
      expect(cartData?.tax).toBe(1.44);
      expect(cartData?.tip).toBe(3.00);
      expect(cartData?.total).toBe(26.91);
    });

    it('should return null for non-checkout pages', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.ubereats.com/restaurant/123',
          pathname: '/restaurant/123'
        },
        writable: true
      });
      
      const cartData = await extractor.extractCartData();
      
      expect(cartData).toBeNull();
    });
  });

  describe('extractUberEatsFeatures', () => {
    it('should extract Uber Eats specific features', async () => {
      createMockUberEatsWithPromoCode();
      
      const features = await extractor.extractUberEatsFeatures();
      
      expect(features.promoCode).toBe('SAVE10');
      expect(features.uberOneActive).toBe(true);
    });

    it('should handle missing Uber Eats features', async () => {
      createMockUberEatsCheckoutPage();
      
      const features = await extractor.extractUberEatsFeatures();
      
      expect(features.promoCode).toBeUndefined();
      expect(features.uberOneActive).toBe(false);
    });
  });

  describe('getCheckoutButtonSelector', () => {
    it('should return checkout button selector', () => {
      const selector = extractor.getCheckoutButtonSelector();
      
      expect(selector).toBe('[data-testid="checkout-button"]');
    });
  });

  describe('getExtractionStats', () => {
    it('should return extraction statistics', async () => {
      createMockUberEatsCheckoutPage();
      
      const stats = await extractor.getExtractionStats();
      
      expect(stats.isCheckoutPage).toBe(true);
      expect(stats.restaurantFound).toBe(true);
      expect(stats.itemsCount).toBe(2);
      expect(stats.pricingComplete).toBe(true);
      expect(stats.deliveryInfoFound).toBe(true);
    });

    it('should return stats for empty page', async () => {
      document.body.innerHTML = '';
      
      const stats = await extractor.getExtractionStats();
      
      expect(stats.isCheckoutPage).toBe(false);
      expect(stats.restaurantFound).toBe(false);
      expect(stats.itemsCount).toBe(0);
      expect(stats.pricingComplete).toBe(false);
      expect(stats.deliveryInfoFound).toBe(false);
    });
  });

  describe('validateCartData', () => {
    it('should validate correct cart data', () => {
      const validCartData: CartData = {
        platform: 'ubereats',
        restaurant: {
          name: 'Test Restaurant',
          rating: 4.5
        },
        items: [
          {
            name: 'Test Item',
            price: 10.99,
            quantity: 1
          }
        ],
        subtotal: 10.99,
        deliveryFee: 2.99,
        serviceFee: 1.00,
        tax: 0.88,
        total: 15.86,
        deliveryInfo: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        url: 'https://www.ubereats.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(validCartData)).toBe(true);
    });

    it('should reject cart data with missing restaurant name', () => {
      const invalidCartData: CartData = {
        platform: 'ubereats',
        restaurant: {
          name: '',
          rating: 4.5
        },
        items: [
          {
            name: 'Test Item',
            price: 10.99,
            quantity: 1
          }
        ],
        subtotal: 10.99,
        deliveryFee: 2.99,
        serviceFee: 1.00,
        tax: 0.88,
        total: 15.86,
        deliveryInfo: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        url: 'https://www.ubereats.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(invalidCartData)).toBe(false);
    });

    it('should reject cart data with no items', () => {
      const invalidCartData: CartData = {
        platform: 'ubereats',
        restaurant: {
          name: 'Test Restaurant',
          rating: 4.5
        },
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        serviceFee: 0,
        tax: 0,
        total: 0,
        deliveryInfo: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        url: 'https://www.ubereats.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(invalidCartData)).toBe(false);
    });

    it('should reject cart data with invalid total', () => {
      const invalidCartData: CartData = {
        platform: 'ubereats',
        restaurant: {
          name: 'Test Restaurant',
          rating: 4.5
        },
        items: [
          {
            name: 'Test Item',
            price: 10.99,
            quantity: 1
          }
        ],
        subtotal: 10.99,
        deliveryFee: 2.99,
        serviceFee: 1.00,
        tax: 0.88,
        total: 0,
        deliveryInfo: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        url: 'https://www.ubereats.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(invalidCartData)).toBe(false);
    });
  });
});
