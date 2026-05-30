import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { App } from './App';
import { ComparisonResult, PlatformComparison, UserPreferences } from './types';

const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    openOptionsPage: vi.fn()
  },
  tabs: {
    create: vi.fn()
  }
};

Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
});

const mockUserPreferences: UserPreferences = {
  mpg: 25,
  gasPrice: 3.5,
  preferredPlatforms: ['doordash', 'ubereats', 'grubhub'],
  includeGasCalculation: true,
  showPickupOnly: true,
  showDeliveryOnly: true,
  currency: 'USD'
};

const deliveryComparison: PlatformComparison = {
  platform: 'doordash',
  platformName: 'DoorDash',
  platformIcon: '🚚',
  totalPrice: 19.66,
  deliveryFee: 2.99,
  serviceFee: 1.5,
  tax: 1.2,
  tip: 2,
  estimatedDeliveryTime: '25-35 min',
  isDelivery: true,
  isPickup: false,
  distance: 2.5,
  isBestDeal: true,
  isOriginalPlatform: true,
  savings: 5,
  savingsPercentage: 20.3,
  restaurantInfo: {
    name: 'McDonald\'s',
    rating: 4.5,
    distance: 2.5,
    estimatedTime: '25-35 min'
  },
  items: [
    {
      name: 'Big Mac',
      originalPrice: 5.99,
      platformPrice: 5.99,
      priceDifference: 0,
      isAvailable: true
    }
  ],
  availability: 'available',
  lastUpdated: Date.now()
};

const pickupComparison: PlatformComparison = {
  ...deliveryComparison,
  platform: 'grubhub',
  platformName: 'Grubhub',
  platformIcon: '🛵',
  totalPrice: 15.25,
  estimatedDeliveryTime: undefined,
  estimatedPickupTime: '12 min',
  isDelivery: false,
  isPickup: true,
  distance: 3.1,
  isBestDeal: false,
  isOriginalPlatform: false,
  savings: 1.25,
  restaurantInfo: {
    name: 'McDonald\'s',
    rating: 4.4,
    distance: 3.1,
    estimatedTime: '12 min'
  }
};

const mockComparisonResult: ComparisonResult = {
  id: 'test-comparison',
  originalPlatform: 'doordash',
  comparisons: [
    deliveryComparison,
    {
      ...deliveryComparison,
      platform: 'ubereats',
      platformName: 'Uber Eats',
      platformIcon: '🚗',
      totalPrice: 21.5,
      isBestDeal: false,
      isOriginalPlatform: false,
      savings: 3.16
    },
    pickupComparison
  ],
  timestamp: Date.now()
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.storage.local.get.mockResolvedValue({
      comparison_results: mockComparisonResult,
      user_preferences: mockUserPreferences
    });
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
    mockChrome.runtime.openOptionsPage.mockResolvedValue(undefined);
    mockChrome.tabs.create.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a loading state before storage data resolves', () => {
    mockChrome.storage.local.get.mockReturnValue(new Promise(() => {}));
    render(<App />);

    expect(screen.getByText('Loading comparison data...')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh comparison')).toBeDisabled();
  });

  it('loads and renders stored comparison results', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith([
        'comparison_results',
        'user_preferences'
      ]);
    });

    expect(await screen.findByText('Price Comparison')).toBeInTheDocument();
    expect(await screen.findByText('DoorDash')).toBeInTheDocument();
    expect(screen.getByText('Uber Eats')).toBeInTheDocument();
    expect(screen.getByText('Grubhub')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Delivery Only')).toBeInTheDocument();
    expect(screen.getByText('Pickup Only')).toBeInTheDocument();
    expect(screen.getByText('3 comparisons')).toBeInTheDocument();
  });

  it('shows the no-data error state when nothing is stored', async () => {
    mockChrome.storage.local.get.mockResolvedValue({});

    render(<App />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('No comparison data available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('shows a storage failure message when loading throws', async () => {
    mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

    render(<App />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Storage error')).toBeInTheDocument();
  });

  it('filters comparisons when switching to pickup only', async () => {
    render(<App />);

    const pickupTab = await screen.findByRole('button', { name: /Pickup Only/i });
    fireEvent.click(pickupTab);

    expect(await screen.findByText('Grubhub')).toBeInTheDocument();
  });

  it('requests a fresh comparison and reloads stored data on refresh', async () => {
    render(<App />);
    await screen.findByText('DoorDash');
    const initialGetCalls = mockChrome.storage.local.get.mock.calls.length;

    vi.useFakeTimers();
    const refreshButton = screen.getByTitle('Refresh comparison');

    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'REQUEST_COMPARISON',
      data: { refresh: true }
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockChrome.storage.local.get.mock.calls.length).toBeGreaterThan(initialGetCalls);
  });

  it('opens extension settings from the footer', async () => {
    render(<App />);

    const settingsButton = await screen.findByRole('button', { name: /Settings/i });
    fireEvent.click(settingsButton);

    expect(mockChrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });
});
