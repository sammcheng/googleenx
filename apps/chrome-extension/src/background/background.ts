import {
  AuthToken,
  BackendComparisonResult,
  CartData,
  DeliveryPreferences,
  EXTENSION_MESSAGE_TYPES,
  ExtensionMessage,
  PopupComparisonResult,
  PopupPlatformComparison,
  RuntimeResponse,
  STORAGE_KEYS,
  UserPreferences,
} from '@/shared/extension';

const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL || 'https://googleenx.onrender.com').replace(/\/$/, ''),
  compareEndpoint: '/api/v1/compare',
  healthEndpoint: '/api/v1/health',
  timeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
} as const;

const PLATFORM_LABELS: Record<string, { name: string; icon: string }> = {
  doordash: { name: 'DoorDash', icon: '🚚' },
  ubereats: { name: 'Uber Eats', icon: '🚗' },
  grubhub: { name: 'Grubhub', icon: '🛵' },
  seamless: { name: 'Seamless', icon: '🍽️' },
};

interface CompareMessagePayload {
  cartData?: CartData;
  refresh?: boolean;
}

interface HealthStatus {
  serviceWorker: 'running';
  authToken: boolean;
  apiBaseUrl: string;
  pendingComparisons: number;
  timestamp: number;
}

class BackgroundServiceWorker {
  private authToken: AuthToken | null = null;
  private activeComparisons = new Set<string>();

  constructor() {
    this.setupMessageListeners();
    this.setupCleanupAlarm();
    void this.loadAuthToken();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      void this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  private setupCleanupAlarm(): void {
    chrome.alarms.create('cleanup', { periodInMinutes: 5 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'cleanup') {
        void this.checkTokenExpiry();
      }
    });
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: RuntimeResponse | { success: boolean; comparisonId?: string; error?: string }) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case EXTENSION_MESSAGE_TYPES.EXTRACTED_CART_DATA:
          await this.handleCartComparisonRequest(message.data as CartData, sender, sendResponse);
          return;
        case EXTENSION_MESSAGE_TYPES.REQUEST_COMPARISON:
          await this.handleManualComparisonRequest((message.data || message.payload || {}) as CompareMessagePayload, sendResponse);
          return;
        case EXTENSION_MESSAGE_TYPES.GET_STORED_RESULTS:
          await this.handleGetStoredResults(sendResponse);
          return;
        case EXTENSION_MESSAGE_TYPES.CLEAR_STORED_RESULTS:
          await this.handleClearStoredResults(sendResponse);
          return;
        case EXTENSION_MESSAGE_TYPES.AUTH_TOKEN_UPDATE:
          await this.handleAuthTokenUpdate(message.data as AuthToken, sendResponse);
          return;
        case EXTENSION_MESSAGE_TYPES.HEALTH_CHECK:
          await this.handleHealthCheck(sendResponse);
          return;
        default:
          sendResponse({ success: false, error: `Unsupported message type: ${message.type}` });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected background worker error',
      });
    }
  }

  private async handleCartComparisonRequest(
    cartData: CartData,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: { success: boolean; comparisonId?: string; error?: string }) => void,
  ): Promise<void> {
    if (!this.validateCartData(cartData)) {
      sendResponse({ success: false, error: 'Invalid cart data extracted from the page.' });
      return;
    }

    const comparisonId = this.generateComparisonId();
    this.activeComparisons.add(comparisonId);
    const targetTabId = typeof sender.tab?.id === 'number' ? sender.tab.id : undefined;

    await chrome.storage.local.set({ [STORAGE_KEYS.lastCartData]: cartData });
    void this.processComparison(comparisonId, cartData, targetTabId);

    sendResponse({ success: true, comparisonId });
  }

  private async handleManualComparisonRequest(
    payload: CompareMessagePayload,
    sendResponse: (response?: { success: boolean; comparisonId?: string; error?: string }) => void,
  ): Promise<void> {
    let cartData = payload.cartData;

    if (payload.refresh && !cartData) {
      const stored = await chrome.storage.local.get(STORAGE_KEYS.lastCartData);
      cartData = stored[STORAGE_KEYS.lastCartData] as CartData | undefined;
    }

    if (!cartData || !this.validateCartData(cartData)) {
      sendResponse({
        success: false,
        error: 'No cart is available to refresh yet. Open a supported checkout page and compare once first.',
      });
      return;
    }

    const comparisonId = this.generateComparisonId();
    this.activeComparisons.add(comparisonId);
    await chrome.storage.local.set({ [STORAGE_KEYS.lastCartData]: cartData });
    void this.processComparison(comparisonId, cartData);

    sendResponse({ success: true, comparisonId });
  }

  private async processComparison(comparisonId: string, cartData: CartData, targetTabId?: number): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      const apiPayload = this.buildApiPayload(cartData, preferences);
      const backendResult = await this.makeComparisonRequest(apiPayload);
      const popupResult = this.transformBackendResult(backendResult, cartData, preferences);

      await chrome.storage.local.set({
        [STORAGE_KEYS.comparisonResults]: popupResult,
        [STORAGE_KEYS.lastComparison]: {
          id: comparisonId,
          platform: popupResult.originalPlatform,
          timestamp: popupResult.timestamp,
        },
      });

      await this.notifyComparisonComplete(popupResult, targetTabId);
      await this.openPopupOrNotify();
    } catch (error) {
      await this.notifyError(error instanceof Error ? error.message : 'Failed to compare prices.', targetTabId);
    } finally {
      this.activeComparisons.delete(comparisonId);
    }
  }

  private buildApiPayload(cartData: CartData, preferences: UserPreferences) {
    const location = preferences.location || { latitude: 0, longitude: 0 };

    return {
      items: cartData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        modifiers: item.modifiers,
      })),
      location: {
        lat: location.latitude,
        lng: location.longitude,
        address: cartData.deliveryInfo.address,
      },
      deliveryAddress: {
        street: cartData.deliveryInfo.address || 'Unknown',
        city: cartData.deliveryInfo.city || 'Unknown',
        state: cartData.deliveryInfo.state || 'Unknown',
        zipCode: cartData.deliveryInfo.zipCode || '00000',
        country: 'US',
      },
      preferredPlatforms: preferences.preferredPlatforms.length ? preferences.preferredPlatforms : undefined,
      includePickup: true,
      includeGasCalculation: preferences.includeGasCalculation,
      userPreferences: {
        mpg: preferences.mpg,
        gasPrice: preferences.gasPrice,
        currency: preferences.currency,
      },
    };
  }

  private async makeComparisonRequest(payload: unknown): Promise<BackendComparisonResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= API_CONFIG.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (this.authToken && this.authToken.expiresAt > Date.now()) {
          headers.Authorization = `Bearer ${this.authToken.token}`;
        }

        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.compareEndpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(this.formatApiError(response.status, text));
        }

        return (await response.json()) as BackendComparisonResult;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error('Unknown comparison request error');

        if (attempt < API_CONFIG.maxRetries) {
          await this.delay(API_CONFIG.retryDelayMs * attempt);
        }
      }
    }

    throw lastError || new Error('Comparison request failed.');
  }

  private formatApiError(status: number, body: string): string {
    if (status >= 500) {
      return 'The comparison service is temporarily unavailable. Please try again in a moment.';
    }

    if (status === 404) {
      return 'The comparison service endpoint could not be found. Verify the extension API configuration.';
    }

    if (status === 400) {
      return 'The current order could not be compared because required checkout details were missing.';
    }

    return body || `Comparison API returned HTTP ${status}`;
  }

  private transformBackendResult(
    result: BackendComparisonResult,
    cartData: CartData,
    preferences: UserPreferences,
  ): PopupComparisonResult {
    const comparisons: PopupPlatformComparison[] = [];

    for (const platformResult of result.platforms) {
      const label = PLATFORM_LABELS[platformResult.platform] || {
        name: platformResult.platform,
        icon: '🍽️',
      };

      if (platformResult.delivery?.available) {
        comparisons.push({
          platform: platformResult.platform,
          platformName: label.name,
          platformIcon: label.icon,
          totalPrice: platformResult.delivery.total,
          deliveryFee: platformResult.delivery.deliveryFee,
          serviceFee: platformResult.delivery.serviceFee,
          tax: platformResult.delivery.tax,
          tip: platformResult.delivery.tip,
          estimatedDeliveryTime: `${platformResult.delivery.estimatedTime} min`,
          isDelivery: true,
          isPickup: false,
          distance: platformResult.restaurant.distance,
          gasCost: 0,
          isBestDeal: false,
          isOriginalPlatform: cartData.platform === platformResult.platform,
          restaurantInfo: {
            name: platformResult.restaurant.name,
            rating: platformResult.restaurant.rating || 0,
            distance: platformResult.restaurant.distance || 0,
            estimatedTime: `${platformResult.delivery.estimatedTime} min`,
          },
          items: cartData.items.map((item) => ({
            name: item.name,
            originalPrice: item.price,
            platformPrice: item.price,
            priceDifference: 0,
            isAvailable: true,
            modifiers: item.modifiers,
            description: item.description,
          })),
          notes: platformResult.error,
          availability: platformResult.available ? 'available' : 'unavailable',
          lastUpdated: Date.parse(result.timestamp) || Date.now(),
        });
      }

      if (platformResult.pickup?.available) {
        comparisons.push({
          platform: platformResult.platform,
          platformName: label.name,
          platformIcon: label.icon,
          totalPrice: platformResult.pickup.price,
          deliveryFee: 0,
          serviceFee: 0,
          tax: 0,
          estimatedPickupTime: `${platformResult.pickup.estimatedTime} min`,
          isDelivery: false,
          isPickup: true,
          distance: platformResult.restaurant.distance,
          gasCost: platformResult.gasCalculation?.gasCost,
          totalWithGas: platformResult.gasCalculation?.gasCost
            ? platformResult.pickup.price + platformResult.gasCalculation.gasCost
            : platformResult.pickup.price,
          isBestDeal: false,
          isOriginalPlatform: cartData.platform === platformResult.platform,
          restaurantInfo: {
            name: platformResult.restaurant.name,
            rating: platformResult.restaurant.rating || 0,
            distance: platformResult.restaurant.distance || 0,
            estimatedTime: `${platformResult.pickup.estimatedTime} min`,
          },
          items: cartData.items.map((item) => ({
            name: item.name,
            originalPrice: item.price,
            platformPrice: item.price,
            priceDifference: 0,
            isAvailable: true,
            modifiers: item.modifiers,
            description: item.description,
          })),
          notes: platformResult.error,
          availability: platformResult.available ? 'available' : 'unavailable',
          lastUpdated: Date.parse(result.timestamp) || Date.now(),
        });
      }
    }

    const effectivePrices = comparisons.map((entry) => entry.totalWithGas ?? entry.totalPrice);
    const cheapest = effectivePrices.length ? Math.min(...effectivePrices) : 0;
    const mostExpensive = effectivePrices.length ? Math.max(...effectivePrices) : 0;

    const normalizedComparisons = comparisons.map((entry) => {
      const effectivePrice = entry.totalWithGas ?? entry.totalPrice;
      const savings = Math.max(0, mostExpensive - effectivePrice);
      const savingsPercentage = mostExpensive > 0 ? (savings / mostExpensive) * 100 : 0;

      return {
        ...entry,
        isBestDeal: effectivePrice === cheapest,
        savings,
        savingsPercentage,
      };
    });

    return {
      id: result.comparisonId,
      originalPlatform: cartData.platform,
      comparisons: normalizedComparisons,
      timestamp: Date.parse(result.timestamp) || Date.now(),
      userLocation: preferences.location,
    };
  }

  private async getUserPreferences(): Promise<UserPreferences> {
    const [localResult, syncResult] = await Promise.all([
      chrome.storage.local.get(STORAGE_KEYS.userPreferences),
      chrome.storage.sync.get(STORAGE_KEYS.deliveryPreferences),
    ]);

    const localPreferences = localResult[STORAGE_KEYS.userPreferences] as UserPreferences | undefined;
    const syncPreferences = syncResult[STORAGE_KEYS.deliveryPreferences] as DeliveryPreferences | undefined;

    if (localPreferences) {
      return localPreferences;
    }

    return {
      mpg: syncPreferences?.mpg ?? 25,
      gasPrice: syncPreferences?.gasPrice ?? 3.5,
      preferredPlatforms: syncPreferences?.preferredPlatforms ?? ['doordash', 'ubereats', 'grubhub'],
      includeGasCalculation: true,
      showPickupOnly: true,
      showDeliveryOnly: true,
      currency: syncPreferences?.defaultCurrency ?? 'USD',
      location:
        syncPreferences?.location &&
        Number.isFinite(syncPreferences.location.latitude) &&
        Number.isFinite(syncPreferences.location.longitude)
          ? {
              latitude: syncPreferences.location.latitude,
              longitude: syncPreferences.location.longitude,
            }
          : undefined,
    };
  }

  private async handleGetStoredResults(sendResponse: (response?: RuntimeResponse<PopupComparisonResult | null>) => void): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.comparisonResults);
    sendResponse({
      success: true,
      data: (result[STORAGE_KEYS.comparisonResults] as PopupComparisonResult | undefined) || null,
    });
  }

  private async handleClearStoredResults(sendResponse: (response?: RuntimeResponse<null>) => void): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.comparisonResults);
    sendResponse({ success: true, data: null });
  }

  private async handleAuthTokenUpdate(
    tokenData: AuthToken,
    sendResponse: (response?: RuntimeResponse<null>) => void,
  ): Promise<void> {
    this.authToken = tokenData;
    await chrome.storage.local.set({ [STORAGE_KEYS.authToken]: tokenData });
    sendResponse({ success: true, data: null });
  }

  private async handleHealthCheck(sendResponse: (response?: RuntimeResponse<HealthStatus>) => void): Promise<void> {
    sendResponse({
      success: true,
      data: {
        serviceWorker: 'running',
        authToken: Boolean(this.authToken && this.authToken.expiresAt > Date.now()),
        apiBaseUrl: API_CONFIG.baseUrl,
        pendingComparisons: this.activeComparisons.size,
        timestamp: Date.now(),
      },
    });
  }

  private async loadAuthToken(): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.authToken);
    this.authToken = (result[STORAGE_KEYS.authToken] as AuthToken | undefined) || null;
  }

  private async checkTokenExpiry(): Promise<void> {
    if (this.authToken && Date.now() >= this.authToken.expiresAt) {
      this.authToken = null;
      await chrome.storage.local.remove(STORAGE_KEYS.authToken);
    }
  }

  private validateCartData(cartData: CartData): boolean {
    if (!cartData.platform || !cartData.restaurant?.name || !cartData.items.length) {
      return false;
    }

    if (!Number.isFinite(cartData.total) || cartData.total <= 0) {
      return false;
    }

    return cartData.items.every((item) => item.name && item.quantity > 0 && item.price >= 0);
  }

  private async notifyComparisonComplete(results: PopupComparisonResult, targetTabId?: number): Promise<void> {
    if (typeof targetTabId !== 'number') {
      return;
    }

    try {
      await chrome.tabs.sendMessage(targetTabId, {
        type: EXTENSION_MESSAGE_TYPES.COMPARISON_COMPLETE,
        data: results,
      });
    } catch {
      // Ignore tabs without the content script loaded.
    }
  }

  private async notifyError(errorMessage: string, targetTabId?: number): Promise<void> {
    if (typeof targetTabId === 'number') {
      try {
        await chrome.tabs.sendMessage(targetTabId, {
          type: EXTENSION_MESSAGE_TYPES.COMPARISON_ERROR,
          error: errorMessage,
        });
      } catch {
        // Ignore tabs without the content script loaded.
      }
    }

    await this.showNotification('Price comparison failed', errorMessage);
  }

  private async openPopupOrNotify(): Promise<void> {
    try {
      await chrome.action.openPopup();
    } catch {
      await this.showNotification('Price comparison ready', 'Click the extension icon to review the latest results.');
    }
  }

  private async showNotification(title: string, message: string): Promise<void> {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title,
      message,
    });
  }

  private generateComparisonId(): string {
    return `comparison_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

new BackgroundServiceWorker();

export { BackgroundServiceWorker };
