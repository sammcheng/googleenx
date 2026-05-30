import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ComparisonTable, CompactComparisonTable, MobileComparisonTable } from './ComparisonTable';
import { PlatformData } from './types';

Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

const platforms: PlatformData[] = [
  {
    id: 'doordash',
    name: 'doordash',
    displayName: 'DoorDash',
    logo: '🚚',
    deliveryPrice: 19.66,
    pickupPrice: 15.5,
    deliveryTime: '25-35 min',
    pickupTime: '15-20 min',
    status: 'available',
    isBestDelivery: true,
    isBestPickup: true,
    deliverySavings: 5,
    pickupSavings: 3.5,
    url: 'https://www.doordash.com',
    lastUpdated: Date.now(),
  },
  {
    id: 'ubereats',
    name: 'ubereats',
    displayName: 'Uber Eats',
    logo: '🚗',
    deliveryPrice: 21.5,
    pickupPrice: 17.2,
    deliveryTime: '30-40 min',
    pickupTime: '20-25 min',
    status: 'limited',
    isBestDelivery: false,
    isBestPickup: false,
    deliverySavings: 3.16,
    pickupSavings: 1.8,
    url: 'https://www.ubereats.com',
    lastUpdated: Date.now(),
  },
  {
    id: 'postmates',
    name: 'postmates',
    displayName: 'Postmates',
    logo: '📦',
    deliveryPrice: 0,
    pickupPrice: 0,
    deliveryTime: 'N/A',
    pickupTime: 'N/A',
    status: 'unavailable',
    isBestDelivery: false,
    isBestPickup: false,
    url: 'https://www.postmates.com',
    lastUpdated: Date.now(),
  },
];

describe('ComparisonTable', () => {
  it('renders the main columns and platform rows', () => {
    render(<ComparisonTable platforms={platforms} showPickup />);

    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Delivery Price')).toBeInTheDocument();
    expect(screen.getByText('Pickup Price')).toBeInTheDocument();
    expect(screen.getByText('DoorDash')).toBeInTheDocument();
    expect(screen.getByText('Uber Eats')).toBeInTheDocument();
  });

  it('shows empty, loading, and error states', () => {
    const { rerender } = render(<ComparisonTable platforms={[]} loading />);
    expect(screen.getByLabelText('Loading comparison data')).toBeInTheDocument();

    rerender(<ComparisonTable platforms={[]} error="Failed to load data" />);
    expect(screen.getByText('Unable to Load Comparison')).toBeInTheDocument();

    rerender(<ComparisonTable platforms={[]} />);
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
  });

  it('sorts by delivery price when the header is clicked', () => {
    render(<ComparisonTable platforms={platforms} />);

    fireEvent.click(screen.getByText('Delivery Price'));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('aria-label', expect.stringContaining('Postmates'));

    fireEvent.click(screen.getByText('Delivery Price'));
    const updatedRows = screen.getAllByRole('row');
    expect(updatedRows[1]).toHaveAttribute('aria-label', expect.stringContaining('Uber Eats'));
  });

  it('opens the platform URL for available rows only', () => {
    render(<ComparisonTable platforms={platforms} />);

    fireEvent.click(screen.getByLabelText('DoorDash comparison row'));
    expect(window.open).toHaveBeenCalledWith('https://www.doordash.com', '_blank', 'noopener,noreferrer');

    (window.open as ReturnType<typeof vi.fn>).mockClear();
    fireEvent.click(screen.getByLabelText('Postmates comparison row'));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('marks unavailable rows as disabled visually', () => {
    render(<ComparisonTable platforms={platforms} />);

    expect(screen.getByLabelText('Postmates comparison row')).toHaveClass('opacity-50');
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('renders compact and mobile variants', () => {
    const { rerender } = render(<CompactComparisonTable platforms={platforms} />);
    expect(screen.getByLabelText('Platform comparison table')).toBeInTheDocument();

    rerender(<MobileComparisonTable platforms={platforms} />);
    expect(screen.getByLabelText('DoorDash comparison card')).toBeInTheDocument();
  });
});
