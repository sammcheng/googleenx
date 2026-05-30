import { CartData, CartItem, RestaurantInfo, DeliveryInfo } from './types';
import { 
  parsePrice, 
  parseAddress, 
  safeTextContent, 
  waitForElement 
} from '../utils';

/**
 * Uber Eats-specific cart data extractor
 * Handles Uber Eats checkout page structure and data extraction
 * Includes retry logic for dynamic content and Uber Eats specific UI quirks
 */
export class UberEatsExtractor {
  private readonly platform = 'ubereats';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  
  private readonly selectors = {
    // Page detection
    checkoutPage: [
      '[data-testid="checkout-page"]',
      '[data-testid="order-summary"]',
      '.checkout-page',
      '[data-testid="cart-page"]',
      '[data-testid="order-review"]'
    ],
    
    // Restaurant information
    restaurant: {
      name: [
        '[data-testid="restaurant-name"]',
        '[data-testid="store-name"]',
        'h1[data-testid="restaurant-name"]',
        '.restaurant-name',
        '[data-testid="merchant-name"]',
        'h1'
      ],
      id: [
        '[data-testid="restaurant-id"]',
        '[data-testid="store-id"]',
        '[data-testid="merchant-id"]'
      ],
      rating: [
        '[data-testid="restaurant-rating"]',
        '[data-testid="store-rating"]',
        '.restaurant-rating',
        '[data-testid="merchant-rating"]',
        '[aria-label*="rating"]'
      ],
      deliveryTime: [
        '[data-testid="delivery-time"]',
        '[data-testid="estimated-delivery"]',
        '.delivery-time',
        '[data-testid="delivery-estimate"]',
        '[data-testid="eta"]'
      ],
      address: [
        '[data-testid="restaurant-address"]',
        '[data-testid="store-address"]',
        '.restaurant-address',
        '[data-testid="merchant-address"]'
      ]
    },
    
    // Cart items - Uber Eats uses different structure
    cartItems: [
      '[data-testid="cart-item"]',
      '[data-testid="order-item"]',
      '[data-testid="menu-item"]',
      '.cart-item',
      '.order-item',
      '[data-testid="basket-item"]'
    ],
    
    item: {
      name: [
        '[data-testid="item-name"]',
        '[data-testid="menu-item-name"]',
        '.item-name',
        '[data-testid="dish-name"]',
        'h3',
        'h4',
        '[data-testid="product-name"]'
      ],
      price: [
        '[data-testid="item-price"]',
        '[data-testid="menu-item-price"]',
        '.item-price',
        '[data-testid="dish-price"]',
        '.price',
        '[data-testid="product-price"]'
      ],
      quantity: [
        '[data-testid="item-quantity"]',
        '[data-testid="menu-item-quantity"]',
        '.item-quantity',
        '[data-testid="dish-quantity"]',
        '.quantity',
        '[data-testid="product-quantity"]'
      ],
      modifiers: [
        '[data-testid="item-modifiers"]',
        '[data-testid="menu-item-modifiers"]',
        '.item-modifiers',
        '[data-testid="dish-modifiers"]',
        '.modifiers',
        '[data-testid="customizations"]'
      ],
      description: [
        '[data-testid="item-description"]',
        '[data-testid="menu-item-description"]',
        '.item-description',
        '[data-testid="dish-description"]',
        '[data-testid="product-description"]'
      ]
    },
    
    // Pricing information - Uber Eats specific structure
    pricing: {
      subtotal: [
        '[data-testid="subtotal"]',
        '[data-testid="order-subtotal"]',
        '.subtotal',
        '[data-testid="items-total"]'
      ],
      deliveryFee: [
        '[data-testid="delivery-fee"]',
        '[data-testid="delivery-charge"]',
        '.delivery-fee',
        '[data-testid="delivery-cost"]',
        '[data-testid="shipping-fee"]'
      ],
      serviceFee: [
        '[data-testid="service-fee"]',
        '[data-testid="platform-fee"]',
        '.service-fee',
        '[data-testid="small-order-fee"]',
        '[data-testid="service-charge"]'
      ],
      tax: [
        '[data-testid="tax"]',
        '[data-testid="sales-tax"]',
        '.tax',
        '[data-testid="taxes"]'
      ],
      tip: [
        '[data-testid="tip"]',
        '[data-testid="driver-tip"]',
        '.tip',
        '[data-testid="gratuity"]'
      ],
      total: [
        '[data-testid="total"]',
        '[data-testid="order-total"]',
        '.total',
        '[data-testid="final-total"]',
        '[data-testid="grand-total"]'
      ]
    },
    
    // Delivery information
    delivery: {
      address: [
        '[data-testid="delivery-address"]',
        '[data-testid="shipping-address"]',
        '.delivery-address',
        '[data-testid="address"]',
        '[data-testid="delivery-location"]'
      ],
      instructions: [
        '[data-testid="delivery-instructions"]',
        '[data-testid="special-instructions"]',
        '.delivery-instructions',
        '[data-testid="delivery-notes"]'
      ]
    },
    
    // Checkout button
    checkoutButton: [
      '[data-testid="checkout-button"]',
      '[data-testid="place-order-button"]',
      '.checkout-button',
      '[data-testid="order-button"]',
      'button[type="submit"]',
      '[data-testid="proceed-to-payment"]'
    ],
    
    // Uber Eats specific elements
    uberEatsSpecific: {
      // Promo codes and discounts
      promoCode: [
        '[data-testid="promo-code"]',
        '[data-testid="discount-code"]',
        '.promo-code',
        '[data-testid="coupon-code"]'
      ],
      // Uber One membership
      uberOne: [
        '[data-testid="uber-one"]',
        '[data-testid="membership"]',
        '.uber-one',
        '[data-testid="subscription"]'
      ],
      // Delivery options
      deliveryOption: [
        '[data-testid="delivery-option"]',
        '[data-testid="delivery-method"]',
        '.delivery-option'
      ]
    }
  };

  /**
   * Check if current page is an Uber Eats checkout page
   */
  isCheckoutPage(): boolean {
    const pathname = window.location.pathname.toLowerCase();
    const hasCheckoutPath = pathname.includes('/checkout') ||
      pathname.includes('/order') ||
      pathname.includes('/cart') ||
      pathname.includes('/review');

    if (hasCheckoutPath) {
      return true;
    }

    if (pathname === '' || pathname === '/') {
      return this.selectors.checkoutPage.some((selector) =>
        document.querySelector(selector) !== null,
      );
    }

    return false;
  }

  /**
   * Extract restaurant information with retry logic
   */
  async extractRestaurantInfo(): Promise<RestaurantInfo | null> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const name = this.findElementText(this.selectors.restaurant.name);
        if (!name) {
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelay);
            continue;
          }
          console.warn('Uber Eats: Restaurant name not found after retries');
          return null;
        }

        const id = this.findElementText(this.selectors.restaurant.id);
        const ratingText = this.findElementText(this.selectors.restaurant.rating);
        const deliveryTime = this.findElementText(this.selectors.restaurant.deliveryTime);
        const address = this.findElementText(this.selectors.restaurant.address);

        const rating = ratingText ? parseFloat(ratingText) : undefined;
        const parsedAddress = address ? parseAddress(address) : null;

        return {
          name,
          id: id || undefined,
          rating: rating && !isNaN(rating) ? rating : undefined,
          deliveryTime: deliveryTime || undefined,
          address: parsedAddress ? `${parsedAddress.address}, ${parsedAddress.city}, ${parsedAddress.state} ${parsedAddress.zipCode}` : undefined
        };
      } catch (error) {
        console.error(`Uber Eats: Error extracting restaurant info (attempt ${attempt}):`, error);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }
    return null;
  }

  /**
   * Extract cart items with retry logic for dynamic content
   */
  async extractCartItems(): Promise<CartItem[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const items: CartItem[] = [];
        const itemElements = this.findElements(this.selectors.cartItems);

        if (itemElements.length === 0 && attempt < this.maxRetries) {
          console.log(`Uber Eats: No cart items found, retrying... (attempt ${attempt})`);
          await this.delay(this.retryDelay);
          continue;
        }

        itemElements.forEach((itemElement, index) => {
          try {
            const name = this.findElementText(this.selectors.item.name, itemElement);
            const priceText = this.findElementText(this.selectors.item.price, itemElement);
            const quantityText = this.findElementText(this.selectors.item.quantity, itemElement);
            const description = this.findElementText(this.selectors.item.description, itemElement);
            
            if (!name) {
              console.warn(`Uber Eats: Item ${index + 1} missing name, skipping`);
              return;
            }

            const price = parsePrice(priceText);
            const quantity = quantityText ? parseInt(quantityText) || 1 : 1;
            
            // Extract modifiers
            const modifiers = this.extractModifiers(itemElement);

            items.push({
              name,
              price,
              quantity,
              description: description || undefined,
              modifiers: modifiers.length > 0 ? modifiers : undefined
            });
          } catch (itemError) {
            console.error(`Uber Eats: Error extracting item ${index + 1}:`, itemError);
          }
        });

        return items;
      } catch (error) {
        console.error(`Uber Eats: Error extracting cart items (attempt ${attempt}):`, error);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }
    return [];
  }

  /**
   * Extract pricing information with retry logic
   */
  async extractPricing(): Promise<Partial<CartData>> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const subtotal = this.findElementPrice(this.selectors.pricing.subtotal);
        const deliveryFee = this.findElementPrice(this.selectors.pricing.deliveryFee);
        const serviceFee = this.findElementPrice(this.selectors.pricing.serviceFee);
        const tax = this.findElementPrice(this.selectors.pricing.tax);
        const tip = this.findElementPrice(this.selectors.pricing.tip);
        const total = this.findElementPrice(this.selectors.pricing.total);

        // Validate that we have at least subtotal and total
        if (subtotal > 0 || total > 0 || attempt === this.maxRetries) {
          return {
            subtotal,
            deliveryFee,
            serviceFee,
            tax,
            tip: tip > 0 ? tip : undefined,
            total
          };
        }

        if (attempt < this.maxRetries) {
          console.log(`Uber Eats: Pricing not complete, retrying... (attempt ${attempt})`);
          await this.delay(this.retryDelay);
        }
      } catch (error) {
        console.error(`Uber Eats: Error extracting pricing (attempt ${attempt}):`, error);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }
    
    return {
      subtotal: 0,
      deliveryFee: 0,
      serviceFee: 0,
      tax: 0,
      total: 0
    };
  }

  /**
   * Extract delivery information with retry logic
   */
  async extractDeliveryInfo(): Promise<DeliveryInfo | null> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const addressText = this.findElementText(this.selectors.delivery.address);
        const instructions = this.findElementText(this.selectors.delivery.instructions);

        if (!addressText && attempt < this.maxRetries) {
          console.log(`Uber Eats: Delivery address not found, retrying... (attempt ${attempt})`);
          await this.delay(this.retryDelay);
          continue;
        }

        if (!addressText) {
          console.warn('Uber Eats: Delivery address not found after retries');
          return null;
        }

        const parsedAddress = parseAddress(addressText);
        const normalizedState = parsedAddress.state.replace(/\s+\d{5}(?:-\d{4})?$/, '').trim();
        
        return {
          address: parsedAddress.address,
          city: parsedAddress.city,
          state: normalizedState,
          zipCode: parsedAddress.zipCode,
          instructions: instructions || undefined
        };
      } catch (error) {
        console.error(`Uber Eats: Error extracting delivery info (attempt ${attempt}):`, error);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }
    return null;
  }

  /**
   * Get checkout button selector
   */
  getCheckoutButtonSelector(): string {
    return this.selectors.checkoutButton[0];
  }

  /**
   * Extract complete cart data with comprehensive retry logic
   */
  async extractCartData(): Promise<CartData | null> {
    try {
      if (!this.isCheckoutPage()) {
        console.log('Uber Eats: Not on checkout page');
        return null;
      }

      // Wait for essential elements to load
      const elementsReady = await this.waitForCheckoutElements();
      if (!elementsReady) {
        console.warn('Uber Eats: Essential checkout elements not found');
        return null;
      }

      // Extract all data with retry logic
      const [restaurant, items, pricing, deliveryInfo] = await Promise.all([
        this.extractRestaurantInfo(),
        this.extractCartItems(),
        this.extractPricing(),
        this.extractDeliveryInfo()
      ]);

      if (!restaurant || items.length === 0) {
        console.warn('Uber Eats: Missing essential data (restaurant or items)');
        return null;
      }

      const cartData: CartData = {
        platform: this.platform,
        restaurant,
        items,
        deliveryInfo: deliveryInfo || {
          address: '',
          city: '',
          state: '',
          zipCode: ''
        },
        url: window.location.href,
        timestamp: new Date(),
        ...pricing
      } as CartData;

      // Validate extracted data
      if (!this.validateCartData(cartData)) {
        console.warn('Uber Eats: Extracted cart data failed validation');
        return null;
      }

      return cartData;
    } catch (error) {
      console.error('Uber Eats: Error extracting cart data:', error);
      return null;
    }
  }

  /**
   * Extract modifiers for a specific item
   */
  private extractModifiers(itemElement: Element): string[] {
    try {
      const modifierElements = this.findElements(this.selectors.item.modifiers, itemElement);
      return modifierElements
        .flatMap((element) => {
          const childValues = Array.from(element.children)
            .map((child) => safeTextContent(child))
            .filter((text) => text.length > 0);

          if (childValues.length > 0) {
            return childValues;
          }

          return safeTextContent(element)
            .split(/,|\n/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        })
        .filter((text) => text.length > 0);
    } catch (error) {
      console.error('Uber Eats: Error extracting modifiers:', error);
      return [];
    }
  }

  /**
   * Find element using multiple selectors with fallback
   */
  private findElement(selectors: string[], parent: Element = document): Element | null {
    for (const selector of selectors) {
      try {
        const element = parent.querySelector(selector);
        if (element) {
          return element;
        }
      } catch (error) {
        console.warn(`Uber Eats: Invalid selector: ${selector}`, error);
      }
    }
    return null;
  }

  /**
   * Find multiple elements using multiple selectors
   */
  private findElements(selectors: string[], parent: Element = document): Element[] {
    for (const selector of selectors) {
      try {
        const elements = Array.from(parent.querySelectorAll(selector));
        if (elements.length > 0) {
          return elements;
        }
      } catch (error) {
        console.warn(`Uber Eats: Invalid selector: ${selector}`, error);
      }
    }
    return [];
  }

  /**
   * Find element text content using multiple selectors
   */
  private findElementText(selectors: string[], parent: Element = document): string {
    const element = this.findElement(selectors, parent);
    return safeTextContent(element);
  }

  /**
   * Find element price using multiple selectors
   */
  private findElementPrice(selectors: string[], parent: Element = document): number {
    const text = this.findElementText(selectors, parent);
    return parsePrice(text);
  }

  /**
   * Wait for specific elements to appear (useful for dynamic content)
   */
  async waitForCheckoutElements(): Promise<boolean> {
    if (!this.isCheckoutPage()) {
      return false;
    }

    try {
      const restaurantNameSelector = this.selectors.restaurant.name[0];
      const cartItemsSelector = this.selectors.cartItems[0];
      const totalSelector = this.selectors.pricing.total[0];

      const restaurantName = document.querySelector(restaurantNameSelector);
      const cartItems = document.querySelector(cartItemsSelector);
      const total = document.querySelector(totalSelector);

      if (restaurantName && cartItems && total) {
        return true;
      }

      const [resolvedRestaurantName, resolvedCartItems, resolvedTotal] = await Promise.all([
        restaurantName ? Promise.resolve(restaurantName) : waitForElement(restaurantNameSelector, 3000),
        cartItems ? Promise.resolve(cartItems) : waitForElement(cartItemsSelector, 3000),
        total ? Promise.resolve(total) : waitForElement(totalSelector, 3000)
      ]);
      
      return !!(resolvedRestaurantName && resolvedCartItems && resolvedTotal);
    } catch (error) {
      console.error('Uber Eats: Error waiting for checkout elements:', error);
      return false;
    }
  }

  /**
   * Validate extracted cart data
   */
  validateCartData(cartData: CartData): boolean {
    try {
      // Check required fields
      if (!cartData.restaurant.name) {
        console.warn('Uber Eats: Missing restaurant name');
        return false;
      }

      if (cartData.items.length === 0) {
        console.warn('Uber Eats: No items found in cart');
        return false;
      }

      if (cartData.total <= 0) {
        console.warn('Uber Eats: Invalid total amount');
        return false;
      }

      // Validate items
      for (const item of cartData.items) {
        if (!item.name || item.price < 0 || item.quantity <= 0) {
          console.warn('Uber Eats: Invalid item data:', item);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Uber Eats: Error validating cart data:', error);
      return false;
    }
  }

  /**
   * Get extraction statistics for debugging
   */
  async getExtractionStats(): Promise<{
    isCheckoutPage: boolean;
    restaurantFound: boolean;
    itemsCount: number;
    pricingComplete: boolean;
    deliveryInfoFound: boolean;
  }> {
    if (document.body.children.length === 0) {
      return {
        isCheckoutPage: false,
        restaurantFound: false,
        itemsCount: 0,
        pricingComplete: false,
        deliveryInfoFound: false
      };
    }

    if (!this.isCheckoutPage()) {
      return {
        isCheckoutPage: false,
        restaurantFound: false,
        itemsCount: 0,
        pricingComplete: false,
        deliveryInfoFound: false
      };
    }

    const restaurant = await this.extractRestaurantInfo();
    const items = await this.extractCartItems();
    const pricing = await this.extractPricing();
    const deliveryInfo = await this.extractDeliveryInfo();

    return {
      isCheckoutPage: this.isCheckoutPage(),
      restaurantFound: !!restaurant,
      itemsCount: items.length,
      pricingComplete: Boolean(pricing.total),
      deliveryInfoFound: !!deliveryInfo
    };
  }

  /**
   * Extract Uber Eats specific features
   */
  async extractUberEatsFeatures(): Promise<{
    promoCode?: string;
    uberOneActive?: boolean;
    deliveryOption?: string;
  }> {
    try {
      const promoCode = this.findElementText(this.selectors.uberEatsSpecific.promoCode);
      const uberOneElement = this.findElement(this.selectors.uberEatsSpecific.uberOne);
      const deliveryOption = this.findElementText(this.selectors.uberEatsSpecific.deliveryOption);

      return {
        promoCode: promoCode || undefined,
        uberOneActive: !!uberOneElement,
        deliveryOption: deliveryOption || undefined
      };
    } catch (error) {
      console.error('Uber Eats: Error extracting Uber Eats features:', error);
      return {};
    }
  }

  /**
   * Handle Uber Eats specific UI quirks
   */
  private handleUberEatsQuirks(): void {
    try {
      // Handle dynamic loading of cart items
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Check if new cart items were added
            const addedNodes = Array.from(mutation.addedNodes);
            addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.matches(this.selectors.cartItems.join(', '))) {
                  console.log('Uber Eats: New cart item detected');
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Cleanup observer after 10 seconds
      setTimeout(() => {
        observer.disconnect();
      }, 10000);
    } catch (error) {
      console.error('Uber Eats: Error handling UI quirks:', error);
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
