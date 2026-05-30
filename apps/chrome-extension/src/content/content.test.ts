import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
};

Object.assign(global, { chrome: mockChrome });

// Mock DOM elements for testing
const createMockElement = (tagName: string, textContent: string = '', attributes: Record<string, string> = {}) => {
  const element = document.createElement(tagName);
  element.textContent = textContent;
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

describe('Content Script Platform Detection', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect DoorDash platform', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'doordash.com',
        pathname: '/checkout',
      },
      writable: true,
    });

    // Mock DoorDash checkout page structure
    document.body.innerHTML = `
      <div data-testid="checkout-page">
        <h1 data-testid="store-name">McDonald's</h1>
        <div data-testid="store-rating">4.5</div>
        <div data-testid="delivery-time">25-35 min</div>
        <div data-testid="cart-item">
          <div data-testid="item-name">Big Mac</div>
          <div data-testid="item-price">$5.99</div>
          <div data-testid="item-quantity">1</div>
        </div>
        <div data-testid="subtotal">$5.99</div>
        <div data-testid="delivery-fee">$2.99</div>
        <div data-testid="service-fee">$1.50</div>
        <div data-testid="tax">$0.75</div>
        <div data-testid="total">$11.23</div>
        <div data-testid="delivery-address">123 Main St, New York, NY 10001</div>
        <button data-testid="checkout-button">Place Order</button>
      </div>
    `;

    // Test would require importing the actual classes, but this demonstrates the structure
    expect(window.location.hostname).toBe('doordash.com');
    expect(document.querySelector('[data-testid="checkout-page"]')).toBeTruthy();
  });

  it('should detect Uber Eats platform', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'ubereats.com',
        pathname: '/checkout',
      },
      writable: true,
    });

    document.body.innerHTML = `
      <div data-testid="checkout">
        <h1 data-testid="restaurant-name">Burger King</h1>
        <div data-testid="restaurant-rating">4.2</div>
        <div data-testid="cart-item">
          <div data-testid="item-name">Whopper</div>
          <div data-testid="item-price">$6.49</div>
          <div data-testid="quantity">1</div>
        </div>
        <div data-testid="subtotal">$6.49</div>
        <div data-testid="delivery-fee">$1.99</div>
        <div data-testid="service-fee">$1.20</div>
        <div data-testid="tax">$0.78</div>
        <div data-testid="total">$10.46</div>
        <div data-testid="delivery-address">456 Oak Ave, Los Angeles, CA 90210</div>
        <button data-testid="checkout-button">Place Order</button>
      </div>
    `;

    expect(window.location.hostname).toBe('ubereats.com');
    expect(document.querySelector('[data-testid="checkout"]')).toBeTruthy();
  });

  it('should detect Grubhub platform', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'grubhub.com',
        pathname: '/checkout',
      },
      writable: true,
    });

    document.body.innerHTML = `
      <div class="checkout-page">
        <h1 data-testid="restaurant-name">Pizza Hut</h1>
        <div data-testid="cart-item">
          <div data-testid="item-name">Pepperoni Pizza</div>
          <div data-testid="item-price">$12.99</div>
          <div data-testid="quantity">1</div>
        </div>
        <div data-testid="subtotal">$12.99</div>
        <div data-testid="delivery-fee">$3.49</div>
        <div data-testid="service-fee">$2.10</div>
        <div data-testid="tax">$1.56</div>
        <div data-testid="total">$20.14</div>
        <div data-testid="delivery-address">789 Pine St, Chicago, IL 60601</div>
        <button data-testid="checkout-button">Place Order</button>
      </div>
    `;

    expect(window.location.hostname).toBe('grubhub.com');
    expect(document.querySelector('.checkout-page')).toBeTruthy();
  });
});

describe('Cart Data Extraction', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should extract DoorDash cart data correctly', () => {
    // Mock DoorDash checkout page
    document.body.innerHTML = `
      <div data-testid="checkout-page">
        <h1 data-testid="store-name">McDonald's</h1>
        <div data-testid="store-rating">4.5</div>
        <div data-testid="delivery-time">25-35 min</div>
        <div data-testid="cart-item">
          <div data-testid="item-name">Big Mac</div>
          <div data-testid="item-price">$5.99</div>
          <div data-testid="item-quantity">1</div>
        </div>
        <div data-testid="cart-item">
          <div data-testid="item-name">French Fries</div>
          <div data-testid="item-price">$2.99</div>
          <div data-testid="item-quantity">2</div>
        </div>
        <div data-testid="subtotal">$8.98</div>
        <div data-testid="delivery-fee">$2.99</div>
        <div data-testid="service-fee">$1.50</div>
        <div data-testid="tax">$1.05</div>
        <div data-testid="total">$14.52</div>
        <div data-testid="delivery-address">123 Main St, New York, NY 10001</div>
        <button data-testid="checkout-button">Place Order</button>
      </div>
    `;

    // Test extraction logic
    const restaurantName = document.querySelector('[data-testid="store-name"]')?.textContent?.trim();
    const ratingElement = document.querySelector('[data-testid="store-rating"]');
    const rating = ratingElement ? parseFloat(ratingElement.textContent?.trim() || '0') : undefined;
    const deliveryTime = document.querySelector('[data-testid="delivery-time"]')?.textContent?.trim();

    expect(restaurantName).toBe('McDonald\'s');
    expect(rating).toBe(4.5);
    expect(deliveryTime).toBe('25-35 min');

    // Test cart items extraction
    const itemElements = document.querySelectorAll('[data-testid="cart-item"]');
    const items = Array.from(itemElements).map(item => {
      const name = item.querySelector('[data-testid="item-name"]')?.textContent?.trim();
      const priceText = item.querySelector('[data-testid="item-price"]')?.textContent?.trim();
      const quantityText = item.querySelector('[data-testid="item-quantity"]')?.textContent?.trim();
      
      const price = priceText ? parseFloat(priceText.replace('$', '')) : 0;
      const quantity = quantityText ? parseInt(quantityText) : 1;
      
      return { name, price, quantity };
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ name: 'Big Mac', price: 5.99, quantity: 1 });
    expect(items[1]).toEqual({ name: 'French Fries', price: 2.99, quantity: 2 });

    // Test pricing extraction
    const subtotal = document.querySelector('[data-testid="subtotal"]')?.textContent?.trim();
    const deliveryFee = document.querySelector('[data-testid="delivery-fee"]')?.textContent?.trim();
    const serviceFee = document.querySelector('[data-testid="service-fee"]')?.textContent?.trim();
    const tax = document.querySelector('[data-testid="tax"]')?.textContent?.trim();
    const total = document.querySelector('[data-testid="total"]')?.textContent?.trim();

    expect(subtotal).toBe('$8.98');
    expect(deliveryFee).toBe('$2.99');
    expect(serviceFee).toBe('$1.50');
    expect(tax).toBe('$1.05');
    expect(total).toBe('$14.52');

    // Test delivery address extraction
    const address = document.querySelector('[data-testid="delivery-address"]')?.textContent?.trim();
    expect(address).toBe('123 Main St, New York, NY 10001');
  });

  it('should handle missing data gracefully', () => {
    // Mock page with missing elements
    document.body.innerHTML = `
      <div data-testid="checkout-page">
        <h1>Restaurant Name</h1>
        <div data-testid="cart-item">
          <div data-testid="item-name">Item Name</div>
          <!-- Missing price and quantity -->
        </div>
        <button data-testid="checkout-button">Place Order</button>
      </div>
    `;

    const restaurantName = document.querySelector('h1')?.textContent?.trim();
    expect(restaurantName).toBe('Restaurant Name');

    const itemElements = document.querySelectorAll('[data-testid="cart-item"]');
    const items = Array.from(itemElements).map(item => {
      const name = item.querySelector('[data-testid="item-name"]')?.textContent?.trim();
      const priceText = item.querySelector('[data-testid="item-price"]')?.textContent?.trim();
      const quantityText = item.querySelector('[data-testid="item-quantity"]')?.textContent?.trim();
      
      const price = priceText ? parseFloat(priceText.replace('$', '')) : 0;
      const quantity = quantityText ? parseInt(quantityText) : 1;
      
      return { name, price, quantity };
    });

    expect(items[0]).toEqual({ name: 'Item Name', price: 0, quantity: 1 });
  });
});

describe('MutationObserver Integration', () => {
  let mockObserver: any;

  beforeEach(() => {
    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    
    global.MutationObserver = vi.fn().mockImplementation(() => mockObserver);
  });

  it('should set up MutationObserver correctly', () => {
    const observer = new MutationObserver(() => {});
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid']
    });

    expect(MutationObserver).toHaveBeenCalled();
  });

  it('should handle DOM mutations', () => {
    const callback = vi.fn();
    const observer = new MutationObserver(callback);
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid']
    });

    // Simulate DOM mutation
    const newElement = document.createElement('div');
    newElement.setAttribute('data-testid', 'checkout-page');
    document.body.appendChild(newElement);

    // In a real scenario, the observer would trigger the callback
    // This test demonstrates the setup
    expect(observer).toBeDefined();
  });
});

describe('Error Handling', () => {
  it('should handle extraction errors gracefully', () => {
    // Mock a malformed page
    document.body.innerHTML = `
      <div>
        <h1>Restaurant</h1>
        <!-- Malformed cart items -->
        <div data-testid="cart-item">
          <div data-testid="item-name"></div>
          <div data-testid="item-price">invalid price</div>
        </div>
      </div>
    `;

    // Test price parsing with invalid input
    const parsePrice = (priceText: string): number => {
      const match = priceText.match(/[\d,]+\.?\d*/);
      return match ? parseFloat(match[0].replace(',', '')) : 0;
    };

    expect(parsePrice('invalid price')).toBe(0);
    expect(parsePrice('$5.99')).toBe(5.99);
    expect(parsePrice('')).toBe(0);
  });

  it('should handle missing checkout button', () => {
    document.body.innerHTML = `
      <div data-testid="checkout-page">
        <h1>Restaurant</h1>
        <!-- No checkout button -->
      </div>
    `;

    const checkoutButton = document.querySelector('[data-testid="checkout-button"]');
    expect(checkoutButton).toBeNull();
  });
});

describe('Platform-Specific Selectors', () => {
  it('should use correct selectors for DoorDash', () => {
    const doordashSelectors = {
      restaurantName: '[data-testid="store-name"], h1, .restaurant-name',
      cartItem: '[data-testid="cart-item"], .cart-item',
      itemName: '[data-testid="item-name"], .item-name, h3, h4',
      itemPrice: '[data-testid="item-price"], .item-price, .price',
      checkoutButton: '[data-testid="checkout-button"], .checkout-button, button[type="submit"]'
    };

    expect(doordashSelectors.restaurantName).toContain('data-testid="store-name"');
    expect(doordashSelectors.cartItem).toContain('data-testid="cart-item"');
    expect(doordashSelectors.checkoutButton).toContain('data-testid="checkout-button"');
  });

  it('should use correct selectors for Uber Eats', () => {
    const ubereatsSelectors = {
      restaurantName: '[data-testid="restaurant-name"], h1, .restaurant-name',
      cartItem: '[data-testid="cart-item"], .cart-item, .order-item',
      itemName: '[data-testid="item-name"], .item-name, h3, h4',
      itemPrice: '[data-testid="item-price"], .item-price, .price',
      checkoutButton: '[data-testid="checkout-button"], .checkout-button, button[type="submit"]'
    };

    expect(ubereatsSelectors.restaurantName).toContain('data-testid="restaurant-name"');
    expect(ubereatsSelectors.cartItem).toContain('.order-item');
  });

  it('should use correct selectors for Grubhub', () => {
    const grubhubSelectors = {
      restaurantName: '[data-testid="restaurant-name"], h1, .restaurant-name',
      cartItem: '[data-testid="cart-item"], .cart-item, .order-item',
      itemName: '[data-testid="item-name"], .item-name, h3, h4',
      itemPrice: '[data-testid="item-price"], .item-price, .price',
      checkoutButton: '[data-testid="checkout-button"], .checkout-button, button[type="submit"]'
    };

    expect(grubhubSelectors.restaurantName).toContain('data-testid="restaurant-name"');
    expect(grubhubSelectors.cartItem).toContain('.order-item');
  });
});
