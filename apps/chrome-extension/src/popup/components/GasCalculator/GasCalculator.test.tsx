import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CompactGasCalculator, GasCalculator } from './GasCalculator';
import { GasCalculationData } from './types';

const calculation: GasCalculationData = {
  distance: 5,
  gasPrice: 3.5,
  mpg: 25,
  gasCost: 0.7,
  foodCost: 15.5,
  totalPickupCost: 16.2,
  deliveryCost: 19.66,
  savings: 3.46,
  savingsPercentage: 17.6,
  timeToPickup: 15,
  timeToReturn: 15,
  totalTime: 30,
};

describe('GasCalculator', () => {
  it('renders the main gas cost and savings flow', () => {
    render(<GasCalculator calculation={calculation} />);

    expect(screen.getByText('Gas Cost Analysis')).toBeInTheDocument();
    expect(screen.getByText('Worth It')).toBeInTheDocument();
    expect(screen.getAllByText('5.0 miles').length).toBeGreaterThan(0);
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
    expect(screen.getByText('Cost Comparison')).toBeInTheDocument();
    expect(screen.getAllByText(/Pickup is worth it!/).length).toBeGreaterThan(0);
  });

  it('supports editable MPG updates', () => {
    const onMpgChange = vi.fn();
    render(<GasCalculator calculation={calculation} editable onMpgChange={onMpgChange} />);

    fireEvent.click(screen.getByText('Edit MPG'));
    fireEvent.change(screen.getByLabelText('Miles per gallon input'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByText('Save MPG'));

    expect(onMpgChange).toHaveBeenCalledWith(30);
    expect(screen.getAllByText('30 mpg').length).toBeGreaterThan(0);
  });

  it('shows the map only when requested', () => {
    const { rerender } = render(<GasCalculator calculation={calculation} showMap />);
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();

    rerender(<GasCalculator calculation={calculation} showMap={false} />);
    expect(screen.queryByText('Interactive Map')).not.toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    const { container, rerender } = render(<GasCalculator calculation={calculation} loading />);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();

    rerender(<GasCalculator calculation={calculation} error="Failed to calculate" />);
    expect(screen.getByText('Unable to Calculate Gas Cost')).toBeInTheDocument();
    expect(screen.getByText('Failed to calculate')).toBeInTheDocument();
  });

  it('renders the compact variant', () => {
    render(<CompactGasCalculator calculation={calculation} />);

    expect(screen.getByText('Worth It')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Total Pickup')).toBeInTheDocument();
  });
});
