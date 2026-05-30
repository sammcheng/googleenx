import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CartData,
  DeliveryPreferences,
  EXTENSION_MESSAGE_TYPES,
  STORAGE_KEYS,
} from '@/shared/extension';

const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
    tabs: {
      sendMessage: vi.fn(),
      create: vi.fn(),
    },
  action: {
    openPopup: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
};

Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true,
});

global.fetch = vi.fn();

const sampleCart: CartData = {
  platform: 'doordash',
  restaurant: {
    name: 'Test Restaurant',
    rating: 4.5,
  },
  items: [
    {
      name: 'Burger',
      price: 10.99,
      quantity: 1,
    },
  ],
  subtotal: 10.99,
  deliveryFee: 2.99,
  serviceFee: 1,
  tax: 0.88,
  total: 15.86,
  deliveryInfo: {
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '94105',
  },
  url: 'https://doordash.com/checkout',
  timestamp: new Date().toISOString(),
};

const samplePreferences: DeliveryPreferences = {
  defaultCurrency: 'USD',
  preferredPlatforms: ['doordash', 'ubereats'],
  mpg: 25,
  gasPrice: 3.5,
  priceAlerts: true,
  notifications: true,
  autoCompare: true,
  location: {
    latitude: 37.78,
    longitude: -122.4,
    address: 'San Francisco, CA',
  },
};

const backendResponse = {
  comparisonId: 'cmp_123',
  timestamp: new Date().toISOString(),
  platforms: [
    {
      platform: 'doordash',
      available: true,
      restaurant: {
        name: 'Test Restaurant',
        rating: 4.5,
        distance: 2.2,
      },
      delivery: {
        available: true,
        price: 10.99,
        deliveryFee: 2.99,
        serviceFee: 1,
        tax: 0.88,
        total: 15.86,
        estimatedTime: 25,
      },
      pickup: {
        available: true,
        price: 10.99,
        estimatedTime: 15,
      },
      gasCalculation: {
        gasCost: 0.62,
      },
    },
    {
      platform: 'ubereats',
      available: true,
      restaurant: {
        name: 'Test Restaurant',
        rating: 4.4,
        distance: 2.4,
      },
      delivery: {
        available: true,
        price: 10.99,
        deliveryFee: 1.99,
        serviceFee: 0.9,
        tax: 0.84,
        total: 14.72,
        estimatedTime: 28,
      },
    },
  ],
};

const flushAsync = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

describe('BackgroundServiceWorker', () => {
  let messageListener:
    | ((message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => boolean)
    | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });

    mockChrome.storage.local.get.mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.authToken) return {};
      if (key === STORAGE_KEYS.lastCartData) return {};
      if (key === STORAGE_KEYS.comparisonResults) return {};
      return {};
    });
    mockChrome.storage.sync.get.mockResolvedValue({
      [STORAGE_KEYS.deliveryPreferences]: samplePreferences,
    });
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.storage.local.remove.mockResolvedValue(undefined);
    mockChrome.tabs.sendMessage.mockResolvedValue(undefined);
    mockChrome.tabs.create.mockResolvedValue(undefined);
    mockChrome.action.openPopup.mockResolvedValue(undefined);
    mockChrome.notifications.create.mockResolvedValue('notification-id');

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => backendResponse,
      text: async () => JSON.stringify(backendResponse),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers listeners immediately on module load', async () => {
    await requireBackgroundWorker();

    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(mockChrome.alarms.create).toHaveBeenCalledWith('cleanup', { periodInMinutes: 5 });
  });

  it('acknowledges extracted cart data and stores it for refresh', async () => {
    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      {
        type: EXTENSION_MESSAGE_TYPES.EXTRACTED_CART_DATA,
        data: sampleCart,
      },
      { tab: { id: 321 } } as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      comparisonId: expect.any(String),
    });
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEYS.lastCartData]: sampleCart,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      321,
      expect.objectContaining({
        type: EXTENSION_MESSAGE_TYPES.COMPARISON_COMPLETE,
      }),
    );
  });

  it('can refresh using the last stored cart', async () => {
    mockChrome.storage.local.get.mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.lastCartData) {
        return { [STORAGE_KEYS.lastCartData]: sampleCart };
      }
      return {};
    });

    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      {
        type: EXTENSION_MESSAGE_TYPES.REQUEST_COMPARISON,
        data: { refresh: true },
      },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      comparisonId: expect.any(String),
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns stored comparison results', async () => {
    const storedResult = { id: 'cmp_123', originalPlatform: 'doordash', comparisons: [] };
    mockChrome.storage.local.get.mockResolvedValue({
      [STORAGE_KEYS.comparisonResults]: storedResult,
    });

    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      { type: EXTENSION_MESSAGE_TYPES.GET_STORED_RESULTS },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: storedResult,
    });
  });

  it('clears stored comparison results', async () => {
    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      { type: EXTENSION_MESSAGE_TYPES.CLEAR_STORED_RESULTS },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();
    expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(STORAGE_KEYS.comparisonResults);
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: null });
  });

  it('persists transformed comparison results for the popup', async () => {
    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      {
        type: EXTENSION_MESSAGE_TYPES.EXTRACTED_CART_DATA,
        data: sampleCart,
      },
      { tab: { id: 321 } } as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [STORAGE_KEYS.comparisonResults]: expect.objectContaining({
          id: backendResponse.comparisonId,
          originalPlatform: 'doordash',
          comparisons: expect.arrayContaining([
            expect.objectContaining({
              platform: 'doordash',
              isDelivery: true,
            }),
            expect.objectContaining({
              platform: 'doordash',
              isPickup: true,
            }),
          ]),
        }),
      }),
    );
    expect(mockChrome.action.openPopup).toHaveBeenCalled();
  });

  it('returns a useful health check payload', async () => {
    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      { type: EXTENSION_MESSAGE_TYPES.HEALTH_CHECK },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        serviceWorker: 'running',
        authToken: false,
        apiBaseUrl: 'https://api.foodpricecomparison.com',
        pendingComparisons: 0,
        timestamp: expect.any(Number),
      }),
    });
  });

  it('rejects invalid cart payloads', async () => {
    await requireBackgroundWorker();
    const sendResponse = vi.fn();

    messageListener?.(
      {
        type: EXTENSION_MESSAGE_TYPES.EXTRACTED_CART_DATA,
        data: { ...sampleCart, total: 0 },
      },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    await flushAsync();
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid cart data extracted from the page.',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

function requireBackgroundWorker() {
  return vi.importActual<typeof import('./background')>('./background').then(
    (module) => module.BackgroundServiceWorker,
  );
}
