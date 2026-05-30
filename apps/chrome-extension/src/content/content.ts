import {
  CartData,
  CartItem,
  DeliveryPreferences,
  DeliveryInfo,
  EXTENSION_MESSAGE_TYPES,
  RestaurantInfo,
  RuntimeResponse,
  STORAGE_KEYS,
} from '@/shared/extension';

// Platform detection
enum DeliveryPlatform {
  DOORDASH = 'doordash',
  UBER_EATS = 'ubereats',
  GRUBHUB = 'grubhub',
  SEAMLESS = 'seamless',
  POSTMATES = 'postmates',
  UNKNOWN = 'unknown'
}

// Abstract base class for platform extractors
abstract class PlatformExtractor {
  protected platform: DeliveryPlatform;
  
  constructor(platform: DeliveryPlatform) {
    this.platform = platform;
  }

  abstract isCheckoutPage(): boolean;
  abstract extractRestaurantInfo(): RestaurantInfo | null;
  abstract extractCartItems(): CartItem[];
  abstract extractPricing(): Partial<CartData>;
  abstract extractDeliveryInfo(): DeliveryInfo | null;
  abstract getCheckoutButtonSelector(): string;

  getPlatformName(): string {
    return this.platform;
  }
  
  extractCartData(): CartData | null {
    try {
      if (!this.isCheckoutPage()) {
        return null;
      }

      const restaurant = this.extractRestaurantInfo();
      const items = this.extractCartItems();
      const pricing = this.extractPricing();
      const deliveryInfo = this.extractDeliveryInfo();

      if (!restaurant || items.length === 0) {
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
        timestamp: new Date().toISOString(),
        ...pricing
      } as CartData;
    } catch (error) {
      console.error(`Error extracting cart data from ${this.platform}:`, error);
      return null;
    }
  }
}

// DoorDash extractor
class DoorDashExtractor extends PlatformExtractor {
  constructor() {
    super(DeliveryPlatform.DOORDASH);
  }

  isCheckoutPage(): boolean {
    return window.location.pathname.includes('/checkout') || 
           window.location.pathname.includes('/order') ||
           document.querySelector('[data-testid="checkout-page"]') !== null;
  }

  extractRestaurantInfo(): RestaurantInfo | null {
    const nameElement = document.querySelector('[data-testid="store-name"], h1, .restaurant-name');
    const name = nameElement?.textContent?.trim();
    
    if (!name) return null;

    const ratingElement = document.querySelector('[data-testid="store-rating"], .rating');
    const rating = ratingElement ? parseFloat(ratingElement.textContent?.trim() || '0') : undefined;

    const deliveryTimeElement = document.querySelector('[data-testid="delivery-time"], .delivery-time');
    const deliveryTime = deliveryTimeElement?.textContent?.trim();

    return {
      name,
      rating,
      deliveryTime
    };
  }

  extractCartItems(): CartItem[] {
    const items: CartItem[] = [];
    const itemElements = document.querySelectorAll('[data-testid="cart-item"], .cart-item');

    itemElements.forEach(item => {
      const nameElement = item.querySelector('[data-testid="item-name"], .item-name, h3, h4');
      const priceElement = item.querySelector('[data-testid="item-price"], .item-price, .price');
      const quantityElement = item.querySelector('[data-testid="item-quantity"], .item-quantity, .quantity');

      const name = nameElement?.textContent?.trim();
      const priceText = priceElement?.textContent?.trim();
      const quantityText = quantityElement?.textContent?.trim();

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        const quantity = quantityText ? parseInt(quantityText) || 1 : 1;

        items.push({
          name,
          price,
          quantity
        });
      }
    });

    return items;
  }

  extractPricing(): Partial<CartData> {
    const subtotalElement = document.querySelector('[data-testid="subtotal"], .subtotal');
    const deliveryFeeElement = document.querySelector('[data-testid="delivery-fee"], .delivery-fee');
    const serviceFeeElement = document.querySelector('[data-testid="service-fee"], .service-fee');
    const taxElement = document.querySelector('[data-testid="tax"], .tax');
    const totalElement = document.querySelector('[data-testid="total"], .total');

    return {
      subtotal: this.parsePrice(subtotalElement?.textContent?.trim() || '0'),
      deliveryFee: this.parsePrice(deliveryFeeElement?.textContent?.trim() || '0'),
      serviceFee: this.parsePrice(serviceFeeElement?.textContent?.trim() || '0'),
      tax: this.parsePrice(taxElement?.textContent?.trim() || '0'),
      total: this.parsePrice(totalElement?.textContent?.trim() || '0')
    };
  }

  extractDeliveryInfo(): DeliveryInfo | null {
    const addressElement = document.querySelector('[data-testid="delivery-address"], .delivery-address');
    const address = addressElement?.textContent?.trim();
    
    if (!address) return null;

    // Parse address components
    const parts = address.split(',').map(p => p.trim());
    const zipMatch = parts[parts.length - 1]?.match(/(\d{5})/);
    const zipCode = zipMatch ? zipMatch[1] : '';
    
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode
    };
  }

  getCheckoutButtonSelector(): string {
    return '[data-testid="checkout-button"], .checkout-button, button[type="submit"]';
  }

  private parsePrice(priceText: string): number {
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }
}

// Uber Eats extractor
class UberEatsExtractor extends PlatformExtractor {
  constructor() {
    super(DeliveryPlatform.UBER_EATS);
  }

  isCheckoutPage(): boolean {
    return window.location.pathname.includes('/checkout') || 
           window.location.pathname.includes('/order') ||
           document.querySelector('[data-testid="checkout"], .checkout') !== null;
  }

  extractRestaurantInfo(): RestaurantInfo | null {
    const nameElement = document.querySelector('[data-testid="restaurant-name"], h1, .restaurant-name');
    const name = nameElement?.textContent?.trim();
    
    if (!name) return null;

    const ratingElement = document.querySelector('[data-testid="restaurant-rating"], .rating');
    const rating = ratingElement ? parseFloat(ratingElement.textContent?.trim() || '0') : undefined;

    return {
      name,
      rating
    };
  }

  extractCartItems(): CartItem[] {
    const items: CartItem[] = [];
    const itemElements = document.querySelectorAll('[data-testid="cart-item"], .cart-item, .order-item');

    itemElements.forEach(item => {
      const nameElement = item.querySelector('[data-testid="item-name"], .item-name, h3, h4');
      const priceElement = item.querySelector('[data-testid="item-price"], .item-price, .price');
      const quantityElement = item.querySelector('[data-testid="quantity"], .quantity');

      const name = nameElement?.textContent?.trim();
      const priceText = priceElement?.textContent?.trim();
      const quantityText = quantityElement?.textContent?.trim();

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        const quantity = quantityText ? parseInt(quantityText) || 1 : 1;

        items.push({
          name,
          price,
          quantity
        });
      }
    });

    return items;
  }

  extractPricing(): Partial<CartData> {
    const subtotalElement = document.querySelector('[data-testid="subtotal"], .subtotal');
    const deliveryFeeElement = document.querySelector('[data-testid="delivery-fee"], .delivery-fee');
    const serviceFeeElement = document.querySelector('[data-testid="service-fee"], .service-fee');
    const taxElement = document.querySelector('[data-testid="tax"], .tax');
    const totalElement = document.querySelector('[data-testid="total"], .total');

    return {
      subtotal: this.parsePrice(subtotalElement?.textContent?.trim() || '0'),
      deliveryFee: this.parsePrice(deliveryFeeElement?.textContent?.trim() || '0'),
      serviceFee: this.parsePrice(serviceFeeElement?.textContent?.trim() || '0'),
      tax: this.parsePrice(taxElement?.textContent?.trim() || '0'),
      total: this.parsePrice(totalElement?.textContent?.trim() || '0')
    };
  }

  extractDeliveryInfo(): DeliveryInfo | null {
    const addressElement = document.querySelector('[data-testid="delivery-address"], .delivery-address');
    const address = addressElement?.textContent?.trim();
    
    if (!address) return null;

    const parts = address.split(',').map(p => p.trim());
    const zipMatch = parts[parts.length - 1]?.match(/(\d{5})/);
    const zipCode = zipMatch ? zipMatch[1] : '';
    
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode
    };
  }

  getCheckoutButtonSelector(): string {
    return '[data-testid="checkout-button"], .checkout-button, button[type="submit"]';
  }

  private parsePrice(priceText: string): number {
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }
}

// Grubhub extractor
class GrubhubExtractor extends PlatformExtractor {
  constructor() {
    super(DeliveryPlatform.GRUBHUB);
  }

  isCheckoutPage(): boolean {
    return window.location.pathname.includes('/checkout') || 
           window.location.pathname.includes('/order') ||
           document.querySelector('.checkout-page, [data-testid="checkout"]') !== null;
  }

  extractRestaurantInfo(): RestaurantInfo | null {
    const nameElement = document.querySelector('[data-testid="restaurant-name"], h1, .restaurant-name');
    const name = nameElement?.textContent?.trim();
    
    if (!name) return null;

    return { name };
  }

  extractCartItems(): CartItem[] {
    const items: CartItem[] = [];
    const itemElements = document.querySelectorAll('[data-testid="cart-item"], .cart-item, .order-item');

    itemElements.forEach(item => {
      const nameElement = item.querySelector('[data-testid="item-name"], .item-name, h3, h4');
      const priceElement = item.querySelector('[data-testid="item-price"], .item-price, .price');
      const quantityElement = item.querySelector('[data-testid="quantity"], .quantity');

      const name = nameElement?.textContent?.trim();
      const priceText = priceElement?.textContent?.trim();
      const quantityText = quantityElement?.textContent?.trim();

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        const quantity = quantityText ? parseInt(quantityText) || 1 : 1;

        items.push({
          name,
          price,
          quantity
        });
      }
    });

    return items;
  }

  extractPricing(): Partial<CartData> {
    const subtotalElement = document.querySelector('[data-testid="subtotal"], .subtotal');
    const deliveryFeeElement = document.querySelector('[data-testid="delivery-fee"], .delivery-fee');
    const serviceFeeElement = document.querySelector('[data-testid="service-fee"], .service-fee');
    const taxElement = document.querySelector('[data-testid="tax"], .tax');
    const totalElement = document.querySelector('[data-testid="total"], .total');

    return {
      subtotal: this.parsePrice(subtotalElement?.textContent?.trim() || '0'),
      deliveryFee: this.parsePrice(deliveryFeeElement?.textContent?.trim() || '0'),
      serviceFee: this.parsePrice(serviceFeeElement?.textContent?.trim() || '0'),
      tax: this.parsePrice(taxElement?.textContent?.trim() || '0'),
      total: this.parsePrice(totalElement?.textContent?.trim() || '0')
    };
  }

  extractDeliveryInfo(): DeliveryInfo | null {
    const addressElement = document.querySelector('[data-testid="delivery-address"], .delivery-address');
    const address = addressElement?.textContent?.trim();
    
    if (!address) return null;

    const parts = address.split(',').map(p => p.trim());
    const zipMatch = parts[parts.length - 1]?.match(/(\d{5})/);
    const zipCode = zipMatch ? zipMatch[1] : '';
    
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode
    };
  }

  getCheckoutButtonSelector(): string {
    return '[data-testid="checkout-button"], .checkout-button, button[type="submit"]';
  }

  private parsePrice(priceText: string): number {
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }
}

// Factory for creating platform extractors
class PlatformExtractorFactory {
  static createExtractor(): PlatformExtractor | null {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('doordash.com')) {
      return new DoorDashExtractor();
    } else if (hostname.includes('ubereats.com')) {
      return new UberEatsExtractor();
    } else if (hostname.includes('grubhub.com') || hostname.includes('seamless.com')) {
      return new GrubhubExtractor();
    }
    
    return null;
  }
}

// Content script manager
class ContentScriptManager {
  private extractor: PlatformExtractor | null = null;
  private observer: MutationObserver | null = null;
  private compareButton: HTMLElement | null = null;
  private isInitialized = false;
  private autoCompareEnabled = true;
  private autoCompareInFlight = false;
  private lastAutoCompareSignature: string | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.extractor = PlatformExtractorFactory.createExtractor();
    
    if (!this.extractor) {
      console.log('Food Delivery Price Comparison: Unsupported platform');
      return;
    }

    console.log(`Food Delivery Price Comparison: Detected ${this.extractor.getPlatformName()} website`);
    void this.loadPreferences();
    
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }
  }

  private setupObserver(): void {
    if (this.isInitialized) return;
    
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid']
    });

    this.isInitialized = true;
    this.checkForCheckoutPage();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        this.checkForCheckoutPage();
      }
    }
  }

  private checkForCheckoutPage(): void {
    if (!this.extractor) return;

    if (this.extractor.isCheckoutPage()) {
      this.injectCompareButton();
      void this.maybeAutoCompare();
    } else {
      this.removeCompareButton();
      this.lastAutoCompareSignature = null;
    }
  }

  private injectCompareButton(): void {
    if (this.compareButton) return;

    const checkoutButton = document.querySelector(this.extractor!.getCheckoutButtonSelector());
    if (!checkoutButton) return;

    this.compareButton = this.createCompareButton();
    
    // Position button near checkout button
    const container = checkoutButton.parentElement;
    if (container) {
      container.insertBefore(this.compareButton, checkoutButton);
    }
  }

  private removeCompareButton(): void {
    if (this.compareButton) {
      this.compareButton.remove();
      this.compareButton = null;
    }
  }

  private createCompareButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'food-delivery-compare-widget';
    button.innerHTML = `
      <span class="icon">🍽️</span>
      <span class="text">Compare Prices</span>
    `;

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      await this.handleCompareClick();
    });

    return button;
  }

  private async handleCompareClick(): Promise<void> {
    if (!this.extractor) return;

    const cartData = this.extractor.extractCartData();
    if (!cartData) {
      this.showNotification('Could not extract order information', 'error');
      return;
    }

    try {
      // Show loading state
      if (this.compareButton) {
        this.compareButton.innerHTML = `
          <span class="icon">⏳</span>
          <span class="text">Comparing...</span>
        `;
        this.compareButton.style.pointerEvents = 'none';
      }

      const response = await chrome.runtime.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.EXTRACTED_CART_DATA,
        data: cartData,
      }) as RuntimeResponse;

      if (response.success) {
        this.showNotification('Comparison started. Results will appear in the extension popup.', 'success');
      } else {
        this.showNotification(response.error || 'Failed to compare prices', 'error');
      }
    } catch (error) {
      console.error('Error comparing prices:', error);
      this.showNotification('Failed to compare prices', 'error');
    } finally {
      // Reset button
      if (this.compareButton) {
        this.compareButton.innerHTML = `
          <span class="icon">🍽️</span>
          <span class="text">Compare Prices</span>
        `;
        this.compareButton.style.pointerEvents = 'auto';
      }
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get([STORAGE_KEYS.deliveryPreferences]);
      const preferences = result[STORAGE_KEYS.deliveryPreferences] as DeliveryPreferences | undefined;
      this.autoCompareEnabled = preferences?.autoCompare ?? false;
    } catch (error) {
      console.error('Error loading content script preferences:', error);
    }
  }

  private async maybeAutoCompare(): Promise<void> {
    if (!this.extractor || !this.autoCompareEnabled || this.autoCompareInFlight) {
      return;
    }

    const cartData = this.extractor.extractCartData();
    if (!cartData) {
      return;
    }

    const signature = this.createCartSignature(cartData);
    if (signature === this.lastAutoCompareSignature) {
      return;
    }

    this.autoCompareInFlight = true;
    this.lastAutoCompareSignature = signature;

    try {
      const response = await chrome.runtime.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.EXTRACTED_CART_DATA,
        data: cartData,
      }) as RuntimeResponse;

      if (response.success) {
        this.showNotification('Auto-comparing this checkout for you.', 'info');
      } else {
        this.lastAutoCompareSignature = null;
      }
    } catch (error) {
      console.error('Error auto-comparing prices:', error);
      this.lastAutoCompareSignature = null;
    } finally {
      this.autoCompareInFlight = false;
    }
  }

  private createCartSignature(cartData: CartData): string {
    return JSON.stringify({
      platform: cartData.platform,
      restaurant: cartData.restaurant.name,
      total: cartData.total,
      items: cartData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    const notification = document.createElement('div');
    notification.className = `food-delivery-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.removeCompareButton();
  }
}

// Initialize content script
const contentScriptManager = new ContentScriptManager();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === EXTENSION_MESSAGE_TYPES.COMPARISON_COMPLETE) {
    contentScriptManager.showNotification('Comparison complete. Open the extension popup to review results.', 'success');
  }

  if (message.type === EXTENSION_MESSAGE_TYPES.COMPARISON_ERROR) {
    contentScriptManager.showNotification(message.error || 'Comparison failed.', 'error');
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  contentScriptManager.destroy();
});
