import { CartData, CartItem, RestaurantInfo, DeliveryInfo } from './types';
import { 
  parsePrice, 
  parseAddress, 
  safeTextContent, 
  waitForElement 
} from '../utils';

/**
 * DoorDash-specific cart data extractor
 * Handles DoorDash checkout page structure and data extraction
 */
export class DoorDashExtractor {
  private readonly platform = 'doordash';
  private readonly selectors = {
    // Page detection
    checkoutPage: [
      '[data-anchor-id="checkout-page"]',
      '[data-testid="checkout-page"]',
      '.checkout-page',
      '[data-anchor-id="order-summary"]'
    ],
    
    // Restaurant information
    restaurant: {
      name: [
        '[data-anchor-id="store-name"]',
        '[data-testid="store-name"]',
        'h1[data-anchor-id="store-name"]',
        '.store-name',
        '[data-anchor-id="merchant-name"]'
      ],
      id: [
        '[data-anchor-id="store-id"]',
        '[data-testid="store-id"]',
        '[data-anchor-id="merchant-id"]'
      ],
      rating: [
        '[data-anchor-id="store-rating"]',
        '[data-testid="store-rating"]',
        '.store-rating',
        '[data-anchor-id="merchant-rating"]'
      ],
      deliveryTime: [
        '[data-anchor-id="delivery-time"]',
        '[data-testid="delivery-time"]',
        '.delivery-time',
        '[data-anchor-id="estimated-delivery"]'
      ],
      address: [
        '[data-anchor-id="store-address"]',
        '[data-testid="store-address"]',
        '.store-address',
        '[data-anchor-id="merchant-address"]'
      ]
    },
    
    // Cart items
    cartItems: [
      '[data-anchor-id="cart-item"]',
      '[data-testid="cart-item"]',
      '.cart-item',
      '[data-anchor-id="order-item"]',
      '[data-anchor-id="menu-item"]'
    ],
    
    item: {
      name: [
        '[data-anchor-id="item-name"]',
        '[data-testid="item-name"]',
        '.item-name',
        '[data-anchor-id="menu-item-name"]',
        'h3',
        'h4'
      ],
      price: [
        '[data-anchor-id="item-price"]',
        '[data-testid="item-price"]',
        '.item-price',
        '[data-anchor-id="menu-item-price"]',
        '.price'
      ],
      quantity: [
        '[data-anchor-id="item-quantity"]',
        '[data-testid="item-quantity"]',
        '.item-quantity',
        '[data-anchor-id="menu-item-quantity"]',
        '.quantity'
      ],
      modifiers: [
        '[data-anchor-id="item-modifiers"]',
        '[data-testid="item-modifiers"]',
        '.item-modifiers',
        '[data-anchor-id="menu-item-modifiers"]',
        '.modifiers'
      ],
      description: [
        '[data-anchor-id="item-description"]',
        '[data-testid="item-description"]',
        '.item-description',
        '[data-anchor-id="menu-item-description"]'
      ]
    },
    
    // Pricing information
    pricing: {
      subtotal: [
        '[data-anchor-id="subtotal"]',
        '[data-testid="subtotal"]',
        '.subtotal',
        '[data-anchor-id="order-subtotal"]'
      ],
      deliveryFee: [
        '[data-anchor-id="delivery-fee"]',
        '[data-testid="delivery-fee"]',
        '.delivery-fee',
        '[data-anchor-id="delivery-charge"]'
      ],
      serviceFee: [
        '[data-anchor-id="service-fee"]',
        '[data-testid="service-fee"]',
        '.service-fee',
        '[data-anchor-id="platform-fee"]',
        '[data-anchor-id="small-order-fee"]'
      ],
      tax: [
        '[data-anchor-id="tax"]',
        '[data-testid="tax"]',
        '.tax',
        '[data-anchor-id="sales-tax"]'
      ],
      tip: [
        '[data-anchor-id="tip"]',
        '[data-testid="tip"]',
        '.tip',
        '[data-anchor-id="driver-tip"]'
      ],
      total: [
        '[data-anchor-id="total"]',
        '[data-testid="total"]',
        '.total',
        '[data-anchor-id="order-total"]'
      ]
    },
    
    // Delivery information
    delivery: {
      address: [
        '[data-anchor-id="delivery-address"]',
        '[data-testid="delivery-address"]',
        '.delivery-address',
        '[data-anchor-id="shipping-address"]'
      ],
      instructions: [
        '[data-anchor-id="delivery-instructions"]',
        '[data-testid="delivery-instructions"]',
        '.delivery-instructions',
        '[data-anchor-id="special-instructions"]'
      ]
    },
    
    // Checkout button
    checkoutButton: [
      '[data-anchor-id="checkout-button"]',
      '[data-testid="checkout-button"]',
      '.checkout-button',
      '[data-anchor-id="place-order-button"]',
      'button[type="submit"]'
    ]
  };

  /**
   * Check if current page is a DoorDash checkout page
   */
  isCheckoutPage(): boolean {
    const pathname = window.location.pathname.toLowerCase();
    const hasCheckoutPath = pathname.includes('/checkout') || 
                           pathname.includes('/order') ||
                           pathname.includes('/cart');
    
    const hasCheckoutElement = this.selectors.checkoutPage.some(selector => 
      document.querySelector(selector) !== null
    );
    
    return hasCheckoutPath || hasCheckoutElement;
  }

  /**
   * Extract restaurant information
   */
  extractRestaurantInfo(): RestaurantInfo | null {
    try {
      const name = this.findElementText(this.selectors.restaurant.name);
      if (!name) {
        console.warn('DoorDash: Restaurant name not found');
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
      console.error('DoorDash: Error extracting restaurant info:', error);
      return null;
    }
  }

  /**
   * Extract cart items with modifiers and descriptions
   */
  extractCartItems(): CartItem[] {
    try {
      const items: CartItem[] = [];
      const itemElements = this.findElements(this.selectors.cartItems);

      itemElements.forEach((itemElement, index) => {
        try {
          const name = this.findElementText(this.selectors.item.name, itemElement);
          const priceText = this.findElementText(this.selectors.item.price, itemElement);
          const quantityText = this.findElementText(this.selectors.item.quantity, itemElement);
          const description = this.findElementText(this.selectors.item.description, itemElement);
          
          if (!name) {
            console.warn(`DoorDash: Item ${index + 1} missing name, skipping`);
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
          console.error(`DoorDash: Error extracting item ${index + 1}:`, itemError);
        }
      });

      return items;
    } catch (error) {
      console.error('DoorDash: Error extracting cart items:', error);
      return [];
    }
  }

  /**
   * Extract pricing information
   */
  extractPricing(): Partial<CartData> {
    try {
      const subtotal = this.findElementPrice(this.selectors.pricing.subtotal);
      const deliveryFee = this.findElementPrice(this.selectors.pricing.deliveryFee);
      const serviceFee = this.findElementPrice(this.selectors.pricing.serviceFee);
      const tax = this.findElementPrice(this.selectors.pricing.tax);
      const tip = this.findElementPrice(this.selectors.pricing.tip);
      const total = this.findElementPrice(this.selectors.pricing.total);

      return {
        subtotal,
        deliveryFee,
        serviceFee,
        tax,
        tip: tip > 0 ? tip : undefined,
        total
      };
    } catch (error) {
      console.error('DoorDash: Error extracting pricing:', error);
      return {
        subtotal: 0,
        deliveryFee: 0,
        serviceFee: 0,
        tax: 0,
        total: 0
      };
    }
  }

  /**
   * Extract delivery information
   */
  extractDeliveryInfo(): DeliveryInfo | null {
    try {
      const addressText = this.findElementText(this.selectors.delivery.address);
      const instructions = this.findElementText(this.selectors.delivery.instructions);

      if (!addressText) {
        console.warn('DoorDash: Delivery address not found');
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
      console.error('DoorDash: Error extracting delivery info:', error);
      return null;
    }
  }

  /**
   * Get checkout button selector
   */
  getCheckoutButtonSelector(): string {
    return this.selectors.checkoutButton[0];
  }

  /**
   * Extract complete cart data
   */
  extractCartData(): CartData | null {
    try {
      if (!this.isCheckoutPage()) {
        console.log('DoorDash: Not on checkout page');
        return null;
      }

      const restaurant = this.extractRestaurantInfo();
      const items = this.extractCartItems();
      const pricing = this.extractPricing();
      const deliveryInfo = this.extractDeliveryInfo();

      if (!restaurant || items.length === 0) {
        console.warn('DoorDash: Missing essential data (restaurant or items)');
        return null;
      }

      return {
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
    } catch (error) {
      console.error('DoorDash: Error extracting cart data:', error);
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
        .flatMap((element) =>
          safeTextContent(element)
            .split(/,|\n/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0),
        )
        .filter((text) => text.length > 0);
    } catch (error) {
      console.error('DoorDash: Error extracting modifiers:', error);
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
        console.warn(`DoorDash: Invalid selector: ${selector}`, error);
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
        console.warn(`DoorDash: Invalid selector: ${selector}`, error);
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
    try {
      const restaurantName = await waitForElement(this.selectors.restaurant.name[0], 3000);
      const cartItems = await waitForElement(this.selectors.cartItems[0], 3000);
      const total = await waitForElement(this.selectors.pricing.total[0], 3000);
      
      return !!(restaurantName && cartItems && total);
    } catch (error) {
      console.error('DoorDash: Error waiting for checkout elements:', error);
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
        console.warn('DoorDash: Missing restaurant name');
        return false;
      }

      if (cartData.items.length === 0) {
        console.warn('DoorDash: No items found in cart');
        return false;
      }

      if (cartData.total <= 0) {
        console.warn('DoorDash: Invalid total amount');
        return false;
      }

      // Validate items
      for (const item of cartData.items) {
        if (!item.name || item.price < 0 || item.quantity <= 0) {
          console.warn('DoorDash: Invalid item data:', item);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('DoorDash: Error validating cart data:', error);
      return false;
    }
  }

  /**
   * Get extraction statistics for debugging
   */
  getExtractionStats(): {
    isCheckoutPage: boolean;
    restaurantFound: boolean;
    itemsCount: number;
    pricingComplete: boolean;
    deliveryInfoFound: boolean;
  } {
    const restaurant = this.extractRestaurantInfo();
    const items = this.extractCartItems();
    const pricing = this.extractPricing();
    const deliveryInfo = this.extractDeliveryInfo();

    return {
      isCheckoutPage: this.isCheckoutPage(),
      restaurantFound: !!restaurant,
      itemsCount: items.length,
      pricingComplete: Boolean(pricing.total),
      deliveryInfoFound: !!deliveryInfo
    };
  }
}
