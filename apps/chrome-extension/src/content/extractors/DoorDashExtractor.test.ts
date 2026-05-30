import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DoorDashExtractor } from './DoorDashExtractor';
import { CartData } from './types';

// Mock DOM utilities
vi.mock('../utils', () => ({
  parsePrice: vi.fn((text: string) => {
    if (!text || text.toLowerCase().includes('free')) return 0;
    const match = text.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }),
  parseAddress: vi.fn((address: string) => {
    if (!address) return { address: '', city: '', state: '', zipCode: '' };
    const parts = address.split(',').map(p => p.trim());
    const zipMatch = parts[parts.length - 1]?.match(/(\d{5})/);
    const zipCode = zipMatch ? zipMatch[1] : '';
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode
    };
  }),
  safeTextContent: vi.fn((element: Element | null) => element?.textContent?.trim() || ''),
  safeNumericContent: vi.fn((element: Element | null) => {
    const text = element?.textContent?.trim();
    if (!text) return 0;
    const match = text.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }),
  waitForElement: vi.fn((selector: string) => Promise.resolve(document.querySelector(selector)))
}));

describe('DoorDashExtractor', () => {
  let extractor: DoorDashExtractor;

  beforeEach(() => {
    extractor = new DoorDashExtractor();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Platform Detection', () => {
    it('should detect DoorDash checkout page by URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'doordash.com',
          pathname: '/checkout',
        },
        writable: true,
      });

      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should detect DoorDash checkout page by DOM elements', () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'doordash.com',
          pathname: '/restaurant',
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="cart-item">
            <div data-anchor-id="item-name">Big Mac</div>
            <div data-anchor-id="item-price">$5.99</div>
            <div data-anchor-id="item-quantity">1</div>
          </div>
          <div data-anchor-id="total">$8.98</div>
          <button data-anchor-id="checkout-button">Place Order</button>
        </div>
      `;

      expect(extractor.isCheckoutPage()).toBe(true);
    });

    it('should return false for non-checkout pages', () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'doordash.com',
          pathname: '/restaurant/123',
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div>
          <h1>Restaurant Menu</h1>
        </div>
      `;

      expect(extractor.isCheckoutPage()).toBe(false);
    });
  });

  describe('Restaurant Information Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="store-rating">4.5</div>
          <div data-anchor-id="delivery-time">25-35 min</div>
          <div data-anchor-id="store-address">123 Main St, New York, NY 10001</div>
        </div>
      `;
    });

    it('should extract restaurant name', () => {
      const restaurant = extractor.extractRestaurantInfo();
      expect(restaurant?.name).toBe('McDonald\'s');
    });

    it('should extract restaurant rating', () => {
      const restaurant = extractor.extractRestaurantInfo();
      expect(restaurant?.rating).toBe(4.5);
    });

    it('should extract delivery time', () => {
      const restaurant = extractor.extractRestaurantInfo();
      expect(restaurant?.deliveryTime).toBe('25-35 min');
    });

    it('should handle missing restaurant name', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <div data-anchor-id="store-rating">4.5</div>
        </div>
      `;

      const restaurant = extractor.extractRestaurantInfo();
      expect(restaurant).toBeNull();
    });

    it('should handle invalid rating', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="store-rating">invalid</div>
        </div>
      `;

      const restaurant = extractor.extractRestaurantInfo();
      expect(restaurant?.rating).toBeUndefined();
    });
  });

  describe('Cart Items Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="cart-item">
            <div data-anchor-id="item-name">Big Mac</div>
            <div data-anchor-id="item-price">$5.99</div>
            <div data-anchor-id="item-quantity">1</div>
            <div data-anchor-id="item-description">Classic burger</div>
            <div data-anchor-id="item-modifiers">Extra Pickles, No Onions</div>
          </div>
          <div data-anchor-id="cart-item">
            <div data-anchor-id="item-name">French Fries</div>
            <div data-anchor-id="item-price">$2.99</div>
            <div data-anchor-id="item-quantity">2</div>
          </div>
        </div>
      `;
    });

    it('should extract cart items with all properties', () => {
      const items = extractor.extractCartItems();
      
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        name: 'Big Mac',
        price: 5.99,
        quantity: 1,
        description: 'Classic burger',
        modifiers: ['Extra Pickles', 'No Onions']
      });
      expect(items[1]).toEqual({
        name: 'French Fries',
        price: 2.99,
        quantity: 2
      });
    });

    it('should handle items with missing data', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="cart-item">
            <div data-anchor-id="item-name">Big Mac</div>
            <!-- Missing price and quantity -->
          </div>
        </div>
      `;

      const items = extractor.extractCartItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({
        name: 'Big Mac',
        price: 0,
        quantity: 1
      });
    });

    it('should handle empty cart', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
        </div>
      `;

      const items = extractor.extractCartItems();
      expect(items).toHaveLength(0);
    });
  });

  describe('Pricing Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="subtotal">$8.98</div>
          <div data-anchor-id="delivery-fee">$2.99</div>
          <div data-anchor-id="service-fee">$1.50</div>
          <div data-anchor-id="tax">$1.05</div>
          <div data-anchor-id="tip">$2.00</div>
          <div data-anchor-id="total">$16.52</div>
        </div>
      `;
    });

    it('should extract all pricing information', () => {
      const pricing = extractor.extractPricing();
      
      expect(pricing).toEqual({
        subtotal: 8.98,
        deliveryFee: 2.99,
        serviceFee: 1.50,
        tax: 1.05,
        tip: 2.00,
        total: 16.52
      });
    });

    it('should handle missing pricing elements', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="total">$16.52</div>
        </div>
      `;

      const pricing = extractor.extractPricing();
      expect(pricing.total).toBe(16.52);
      expect(pricing.subtotal).toBe(0);
    });

    it('should handle free delivery', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="delivery-fee">Free</div>
          <div data-anchor-id="total">$8.98</div>
        </div>
      `;

      const pricing = extractor.extractPricing();
      expect(pricing.deliveryFee).toBe(0);
    });
  });

  describe('Delivery Information Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="delivery-address">123 Main St, New York, NY 10001</div>
          <div data-anchor-id="delivery-instructions">Ring doorbell twice</div>
        </div>
      `;
    });

    it('should extract delivery address and instructions', () => {
      const deliveryInfo = extractor.extractDeliveryInfo();
      
      expect(deliveryInfo).toEqual({
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        instructions: 'Ring doorbell twice'
      });
    });

    it('should handle missing delivery address', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
        </div>
      `;

      const deliveryInfo = extractor.extractDeliveryInfo();
      expect(deliveryInfo).toBeNull();
    });

    it('should handle malformed address', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="delivery-address">Invalid Address</div>
        </div>
      `;

      const deliveryInfo = extractor.extractDeliveryInfo();
      expect(deliveryInfo?.address).toBe('Invalid Address');
      expect(deliveryInfo?.city).toBe('');
    });
  });

  describe('Complete Cart Data Extraction', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'doordash.com',
          pathname: '/checkout',
          href: 'https://doordash.com/checkout'
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="store-rating">4.5</div>
          <div data-anchor-id="delivery-time">25-35 min</div>
          <div data-anchor-id="store-address">456 Oak Ave, Los Angeles, CA 90210</div>
          
          <div data-anchor-id="cart-item">
            <div data-anchor-id="item-name">Big Mac</div>
            <div data-anchor-id="item-price">$5.99</div>
            <div data-anchor-id="item-quantity">1</div>
            <div data-anchor-id="item-modifiers">Extra Pickles</div>
          </div>
          
          <div data-anchor-id="subtotal">$5.99</div>
          <div data-anchor-id="delivery-fee">$2.99</div>
          <div data-anchor-id="service-fee">$1.50</div>
          <div data-anchor-id="tax">$0.75</div>
          <div data-anchor-id="total">$11.23</div>
          
          <div data-anchor-id="delivery-address">789 Pine St, Chicago, IL 60601</div>
          <div data-anchor-id="delivery-instructions">Leave at door</div>
          
          <button data-anchor-id="checkout-button">Place Order</button>
        </div>
      `;
    });

    it('should extract complete cart data', () => {
      const cartData = extractor.extractCartData();
      
      expect(cartData).not.toBeNull();
      expect(cartData?.platform).toBe('doordash');
      expect(cartData?.restaurant.name).toBe('McDonald\'s');
      expect(cartData?.restaurant.rating).toBe(4.5);
      expect(cartData?.items).toHaveLength(1);
      expect(cartData?.items[0].name).toBe('Big Mac');
      expect(cartData?.subtotal).toBe(5.99);
      expect(cartData?.total).toBe(11.23);
      expect(cartData?.deliveryInfo.address).toBe('789 Pine St');
      expect(cartData?.url).toBe('https://doordash.com/checkout');
      expect(cartData?.timestamp).toBeInstanceOf(Date);
    });

    it('should return null for non-checkout pages', () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'doordash.com',
          pathname: '/restaurant',
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div>
          <h1>Restaurant Menu</h1>
        </div>
      `;

      const cartData = extractor.extractCartData();
      expect(cartData).toBeNull();
    });

    it('should return null when essential data is missing', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <!-- Missing restaurant name and items -->
          <div data-anchor-id="total">$11.23</div>
        </div>
      `;

      const cartData = extractor.extractCartData();
      expect(cartData).toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('should validate complete cart data', () => {
      const validCartData: CartData = {
        platform: 'doordash',
        restaurant: { name: 'McDonald\'s' },
        items: [{ name: 'Big Mac', price: 5.99, quantity: 1 }],
        subtotal: 5.99,
        deliveryFee: 2.99,
        serviceFee: 1.50,
        tax: 0.75,
        total: 11.23,
        deliveryInfo: {
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        url: 'https://doordash.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(validCartData)).toBe(true);
    });

    it('should reject cart data with missing restaurant name', () => {
      const invalidCartData: CartData = {
        platform: 'doordash',
        restaurant: { name: '' },
        items: [{ name: 'Big Mac', price: 5.99, quantity: 1 }],
        subtotal: 5.99,
        deliveryFee: 2.99,
        serviceFee: 1.50,
        tax: 0.75,
        total: 11.23,
        deliveryInfo: {
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        url: 'https://doordash.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(invalidCartData)).toBe(false);
    });

    it('should reject cart data with empty items', () => {
      const invalidCartData: CartData = {
        platform: 'doordash',
        restaurant: { name: 'McDonald\'s' },
        items: [],
        subtotal: 5.99,
        deliveryFee: 2.99,
        serviceFee: 1.50,
        tax: 0.75,
        total: 11.23,
        deliveryInfo: {
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        url: 'https://doordash.com/checkout',
        timestamp: new Date()
      };

      expect(extractor.validateCartData(invalidCartData)).toBe(false);
    });
  });

  describe('Extraction Statistics', () => {
    it('should provide extraction statistics', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="cart-item">
            <div data-anchor-id="item-name">Big Mac</div>
            <div data-anchor-id="item-price">$5.99</div>
          </div>
          <div data-anchor-id="total">$11.23</div>
          <div data-anchor-id="delivery-address">123 Main St, New York, NY 10001</div>
        </div>
      `;

      const stats = extractor.getExtractionStats();
      
      expect(stats.isCheckoutPage).toBe(true);
      expect(stats.restaurantFound).toBe(true);
      expect(stats.itemsCount).toBe(1);
      expect(stats.pricingComplete).toBe(true);
      expect(stats.deliveryInfoFound).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM errors gracefully', () => {
      // Mock a scenario where querySelector throws an error
      const originalQuerySelector = document.querySelector;
      vi.spyOn(document, 'querySelector').mockImplementation(() => {
        throw new Error('DOM Error');
      });

      const restaurant = extractor.extractRestaurantInfo();
      expect(restaurant).toBeNull();

      // Restore original method
      vi.mocked(document.querySelector).mockRestore();
    });

    it('should handle malformed price data', () => {
      document.body.innerHTML = `
        <div data-anchor-id="checkout-page">
          <h1 data-anchor-id="store-name">McDonald's</h1>
          <div data-anchor-id="total">invalid price</div>
        </div>
      `;

      const pricing = extractor.extractPricing();
      expect(pricing.total).toBe(0);
    });
  });
});
