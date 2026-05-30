/**
 * Example usage of DoorDashExtractor
 * Demonstrates how to use the extractor in a Chrome extension content script
 */

import { DoorDashExtractor } from './DoorDashExtractor';
import { CartData } from './types';

// Example: Basic usage in content script
export function initializeDoorDashExtraction() {
  const extractor = new DoorDashExtractor();
  
  // Check if we're on a DoorDash checkout page
  if (!extractor.isCheckoutPage()) {
    console.log('Not on DoorDash checkout page');
    return;
  }

  console.log('DoorDash checkout page detected');

  // Extract cart data
  const cartData = extractor.extractCartData();
  
  if (cartData) {
    console.log('Cart data extracted successfully:', cartData);
    return cartData;
  } else {
    console.warn('Failed to extract cart data');
    return null;
  }
}

// Example: Advanced usage with error handling and validation
export async function extractCartDataWithValidation(): Promise<CartData | null> {
  const extractor = new DoorDashExtractor();
  
  try {
    // Wait for checkout elements to load (for dynamic content)
    const elementsReady = await extractor.waitForCheckoutElements();
    if (!elementsReady) {
      console.warn('Checkout elements not found within timeout');
      return null;
    }

    // Extract cart data
    const cartData = extractor.extractCartData();
    if (!cartData) {
      console.warn('No cart data extracted');
      return null;
    }

    // Validate extracted data
    const isValid = extractor.validateCartData(cartData);
    if (!isValid) {
      console.error('Extracted cart data is invalid');
      return null;
    }

    console.log('Cart data extracted and validated successfully');
    return cartData;

  } catch (error) {
    console.error('Error during cart data extraction:', error);
    return null;
  }
}

// Example: Extract specific data components
export function extractSpecificData() {
  const extractor = new DoorDashExtractor();
  
  if (!extractor.isCheckoutPage()) {
    return null;
  }

  // Extract restaurant information only
  const restaurant = extractor.extractRestaurantInfo();
  console.log('Restaurant:', restaurant);

  // Extract cart items only
  const items = extractor.extractCartItems();
  console.log('Items:', items);

  // Extract pricing only
  const pricing = extractor.extractPricing();
  console.log('Pricing:', pricing);

  // Extract delivery information only
  const delivery = extractor.extractDeliveryInfo();
  console.log('Delivery:', delivery);

  return {
    restaurant,
    items,
    pricing,
    delivery
  };
}

// Example: Get extraction statistics for debugging
export function getExtractionDebugInfo() {
  const extractor = new DoorDashExtractor();
  
  const stats = extractor.getExtractionStats();
  console.log('Extraction statistics:', stats);

  // Log detailed information
  console.log('Is checkout page:', stats.isCheckoutPage);
  console.log('Restaurant found:', stats.restaurantFound);
  console.log('Items count:', stats.itemsCount);
  console.log('Pricing complete:', stats.pricingComplete);
  console.log('Delivery info found:', stats.deliveryInfoFound);

  return stats;
}

// Example: Handle extraction in a Chrome extension content script
export function setupDoorDashContentScript() {
  // Initialize extractor
  const extractor = new DoorDashExtractor();
  
  // Set up mutation observer to detect page changes
  const observer = new MutationObserver((mutations) => {
    // Check if we're now on a checkout page
    if (extractor.isCheckoutPage()) {
      console.log('DoorDash checkout page detected');
      
      // Extract cart data
      const cartData = extractor.extractCartData();
      if (cartData) {
        // Send data to background script
        chrome.runtime.sendMessage({
          type: 'CART_DATA_EXTRACTED',
          data: cartData
        });
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-anchor-id', 'data-testid']
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
}

// Example: Extract data with retry logic
export async function extractWithRetry(maxRetries: number = 3): Promise<CartData | null> {
  const extractor = new DoorDashExtractor();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Extraction attempt ${attempt}/${maxRetries}`);
    
    try {
      const cartData = extractor.extractCartData();
      if (cartData && extractor.validateCartData(cartData)) {
        console.log('Cart data extracted successfully on attempt', attempt);
        return cartData;
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
    }
    
    // Wait before retry
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('All extraction attempts failed');
  return null;
}

// Example: Extract data with custom validation
export function extractWithCustomValidation() {
  const extractor = new DoorDashExtractor();
  
  if (!extractor.isCheckoutPage()) {
    return null;
  }

  const cartData = extractor.extractCartData();
  if (!cartData) {
    return null;
  }

  // Custom validation rules
  const customValidation = {
    hasMinimumItems: cartData.items.length >= 1,
    hasValidTotal: cartData.total > 0,
    hasRestaurantName: cartData.restaurant.name.length > 0,
    hasDeliveryAddress: cartData.deliveryInfo.address.length > 0
  };

  const isValid = Object.values(customValidation).every(Boolean);
  
  if (!isValid) {
    console.warn('Custom validation failed:', customValidation);
    return null;
  }

  console.log('Custom validation passed');
  return cartData;
}

// Example: Extract data for price comparison
export function extractForPriceComparison() {
  const extractor = new DoorDashExtractor();
  
  if (!extractor.isCheckoutPage()) {
    return null;
  }

  const cartData = extractor.extractCartData();
  if (!cartData) {
    return null;
  }

  // Format data for price comparison API
  const comparisonData = {
    platform: 'doordash',
    restaurant: {
      name: cartData.restaurant.name,
      id: cartData.restaurant.id
    },
    items: cartData.items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers
    })),
    pricing: {
      subtotal: cartData.subtotal,
      deliveryFee: cartData.deliveryFee,
      serviceFee: cartData.serviceFee,
      tax: cartData.tax,
      tip: cartData.tip,
      total: cartData.total
    },
    delivery: {
      address: cartData.deliveryInfo.address,
      city: cartData.deliveryInfo.city,
      state: cartData.deliveryInfo.state,
      zipCode: cartData.deliveryInfo.zipCode
    },
    timestamp: cartData.timestamp
  };

  return comparisonData;
}
