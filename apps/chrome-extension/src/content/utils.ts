// Utility functions for content script

/**
 * Parse price text and extract numeric value
 * @param priceText - Price string (e.g., "$5.99", "5.99", "Free")
 * @returns Parsed price as number
 */
export function parsePrice(priceText: string): number {
  if (!priceText || priceText.toLowerCase().includes('free')) {
    return 0;
  }
  
  const match = priceText.match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(',', '')) : 0;
}

/**
 * Parse address string and extract components
 * @param addressText - Full address string
 * @returns Parsed address components
 */
export function parseAddress(addressText: string): {
  address: string;
  city: string;
  state: string;
  zipCode: string;
} {
  if (!addressText) {
    return {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };
  }

  const parts = addressText.split(',').map(p => p.trim());
  const stateZipPart = parts[2] || '';
  const zipMatch = stateZipPart.match(/(\d{5})/) || parts[parts.length - 1]?.match(/(\d{5})/);
  const stateValue = stateZipPart
    .replace(zipMatch?.[1] || '', '')
    .trim()
    .split(/\s+/)[0] || '';
  const zipCode = zipMatch ? zipMatch[1] : '';
  
  return {
    address: parts[0] || '',
    city: parts[1] || '',
    state: stateValue || parts[2] || '',
    zipCode
  };
}

/**
 * Safely extract text content from element
 * @param element - DOM element
 * @param fallback - Fallback value if element not found
 * @returns Text content or fallback
 */
export function safeTextContent(element: Element | null, fallback: string = ''): string {
  return element?.textContent?.trim() || fallback;
}

/**
 * Safely extract numeric value from element
 * @param element - DOM element
 * @param fallback - Fallback value if element not found
 * @returns Numeric value or fallback
 */
export function safeNumericContent(element: Element | null, fallback: number = 0): number {
  const text = element?.textContent?.trim();
  if (!text) return fallback;
  
  const match = text.match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(',', '')) : fallback;
}

/**
 * Wait for element to appear in DOM
 * @param selector - CSS selector
 * @param timeout - Maximum wait time in milliseconds
 * @returns Promise that resolves with element or null
 */
export function waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((_, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if current page is a checkout/order page
 * @param platform - Platform identifier
 * @returns True if on checkout page
 */
export function isCheckoutPage(platform: string): boolean {
  void platform;
  const pathname = window.location.pathname.toLowerCase();
  const checkoutIndicators = [
    '/checkout',
    '/order',
    '/cart',
    '/payment'
  ];
  
  const hasCheckoutPath = checkoutIndicators.some(indicator => 
    pathname.includes(indicator)
  );
  
  const hasCheckoutElement = document.querySelector(
    '[data-testid*="checkout"], [data-testid*="order"], .checkout, .order'
  ) !== null;
  
  return hasCheckoutPath || hasCheckoutElement;
}

/**
 * Extract restaurant information from page
 * @param selectors - Platform-specific selectors
 * @returns Restaurant information object
 */
export function extractRestaurantInfo(selectors: {
  name: string;
  rating?: string;
  deliveryTime?: string;
}): {
  name: string;
  rating?: number;
  deliveryTime?: string;
} {
  const nameElement = document.querySelector(selectors.name);
  const name = safeTextContent(nameElement);
  
  if (!name) {
    return { name: '' };
  }
  
  const result: any = { name };
  
  if (selectors.rating) {
    const ratingElement = document.querySelector(selectors.rating);
    const ratingText = safeTextContent(ratingElement);
    if (ratingText) {
      const rating = parseFloat(ratingText);
      if (!isNaN(rating)) {
        result.rating = rating;
      }
    }
  }
  
  if (selectors.deliveryTime) {
    const deliveryTimeElement = document.querySelector(selectors.deliveryTime);
    const deliveryTime = safeTextContent(deliveryTimeElement);
    if (deliveryTime) {
      result.deliveryTime = deliveryTime;
    }
  }
  
  return result;
}

/**
 * Extract cart items from page
 * @param selectors - Platform-specific selectors
 * @returns Array of cart items
 */
export function extractCartItems(selectors: {
  item: string;
  name: string;
  price: string;
  quantity: string;
}): Array<{
  name: string;
  price: number;
  quantity: number;
}> {
  const itemElements = document.querySelectorAll(selectors.item);
  const items: Array<{ name: string; price: number; quantity: number }> = [];
  
  itemElements.forEach(item => {
    const nameElement = item.querySelector(selectors.name);
    const priceElement = item.querySelector(selectors.price);
    const quantityElement = item.querySelector(selectors.quantity);
    
    const name = safeTextContent(nameElement);
    const priceText = safeTextContent(priceElement);
    const quantityText = safeTextContent(quantityElement);
    
    if (name && priceText) {
      const price = parsePrice(priceText);
      const quantity = quantityText ? parseInt(quantityText) || 1 : 1;
      
      items.push({ name, price, quantity });
    }
  });
  
  return items;
}

/**
 * Extract pricing information from page
 * @param selectors - Platform-specific selectors
 * @returns Pricing information object
 */
export function extractPricing(selectors: {
  subtotal?: string;
  deliveryFee?: string;
  serviceFee?: string;
  tax?: string;
  tip?: string;
  total?: string;
}): {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  total: number;
} {
  const result: any = {
    subtotal: 0,
    deliveryFee: 0,
    serviceFee: 0,
    tax: 0,
    total: 0
  };
  
  Object.entries(selectors).forEach(([key, selector]) => {
    if (selector) {
      const element = document.querySelector(selector);
      const text = safeTextContent(element);
      const value = parsePrice(text);
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Create a unique ID for elements
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
export function createUniqueId(prefix: string = 'food-delivery'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible in viewport
 * @param element - DOM element
 * @returns True if element is visible
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view
 * @param element - DOM element
 * @param behavior - Scroll behavior
 */
export function scrollIntoView(
  element: Element, 
  behavior: ScrollBehavior = 'smooth'
): void {
  element.scrollIntoView({ 
    behavior, 
    block: 'center', 
    inline: 'center' 
  });
}
